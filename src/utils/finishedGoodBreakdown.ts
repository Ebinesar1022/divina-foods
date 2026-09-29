import type {
  BatchAllocationLine,
  BomItemRow,
  FinishedGoodTargetRow,
  RawMaterialNeedRow,
} from "../types";

// Raw_Materials and Batch_Allocation are both stored once per MRP / production
// target, with no finished-good link. These helpers derive the per-finished-
// good view from each finished good's BOM x target quantity (the same math
// that produced the MRP), so the screen and the batch allocation PDF can show
// "FG-A needs these, FG-B needs those" instead of one combined list.
//
// Where a material is shared, it's handed out to the finished goods in the
// order they're listed: the first one takes what it needs, the next takes
// from what's left, and so on.

export interface FinishedGoodMaterialSection {
  finishedGood: FinishedGoodTargetRow;
  // This finished good's own numbers: stockRequired is BOM x target quantity,
  // allocateQuantity/neededQuantity/status are its share of the material's
  // combined allocation. stockOnHand is the material's shared on-hand stock.
  materials: RawMaterialNeedRow[];
}

export interface BatchAllocationGroupData {
  key: string;
  lines: BatchAllocationLine[];
  material?: RawMaterialNeedRow;
  fallbackName?: string;
}

export interface FinishedGoodBatchSection {
  finishedGood: FinishedGoodTargetRow;
  groups: BatchAllocationGroupData[];
}

const QTY_TOLERANCE = 0.01;

function roundQty(value: number): number {
  if (!isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function nameKey(name: string | undefined): string {
  return (name || "").trim().toLowerCase();
}

function sameMaterial(
  a: { productId?: string; productName?: string },
  b: { productId?: string; productName?: string },
): boolean {
  if (a.productId && b.productId && a.productId === b.productId) return true;
  return !!nameKey(a.productName) && nameKey(a.productName) === nameKey(b.productName);
}

// Splits the combined raw materials into one section per finished good.
// Returns null whenever the result can't be trusted to match what the MRP
// stored (no BOM for a finished good, a material the MRP doesn't know about,
// or per-finished-good totals that don't add up to the stored Stock_Required —
// e.g. the BOM was edited after the MRP was created). Callers then fall back
// to the combined view rather than show numbers that contradict the MRP.
export function buildFinishedGoodSections(
  finishedGoods: FinishedGoodTargetRow[],
  bomByFinishedGood: Record<string, BomItemRow[]> | undefined,
  rawMaterials: RawMaterialNeedRow[],
): FinishedGoodMaterialSection[] | null {
  if (!bomByFinishedGood || !finishedGoods.length || !rawMaterials.length) {
    return null;
  }

  const required = new Map<RawMaterialNeedRow, number[]>();
  rawMaterials.forEach((rm) => required.set(rm, finishedGoods.map(() => 0)));

  for (let i = 0; i < finishedGoods.length; i++) {
    const fg = finishedGoods[i];
    const bom = bomByFinishedGood[fg.id];
    if (!bom || !bom.length) return null;
    for (const item of bom) {
      const rm = rawMaterials.find((r) => sameMaterial(r, item));
      if (!rm) return null;
      const perFg = required.get(rm)!;
      perFg[i] = roundQty(perFg[i] + item.quantityRequired * fg.targetQuantity);
    }
  }

  for (const rm of rawMaterials) {
    const total = required.get(rm)!.reduce((sum, q) => sum + q, 0);
    if (Math.abs(total - rm.stockRequired) > QTY_TOLERANCE) return null;
  }

  const remainingAllocate = new Map<RawMaterialNeedRow, number>();
  rawMaterials.forEach((rm) => remainingAllocate.set(rm, rm.allocateQuantity));

  return finishedGoods.map((fg, i) => {
    const materials: RawMaterialNeedRow[] = [];
    rawMaterials.forEach((rm) => {
      const need = required.get(rm)![i];
      if (need <= 0) return;
      const available = remainingAllocate.get(rm) || 0;
      const allocateQuantity = roundQty(Math.min(need, available));
      remainingAllocate.set(rm, roundQty(available - allocateQuantity));
      const neededQuantity = roundQty(need - allocateQuantity);
      materials.push({
        ...rm,
        stockRequired: need,
        allocateQuantity,
        neededQuantity,
        status: neededQuantity > 0 ? "Needs Purchase" : "Stock Available",
      });
    });
    return { finishedGood: fg, materials };
  });
}

// "10-Oct-2026" (Creator's display format) or ISO -> epoch ms; Infinity when
// it can't be read, so an unreadable expiry sorts last.
export function expiryTime(value: string | undefined): number {
  if (!value) return Infinity;
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(value.trim());
  if (m) {
    const month = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec",
    ].indexOf(m[2].toLowerCase());
    if (month >= 0) return Date.UTC(Number(m[3]), month, Number(m[1]));
  }
  const t = Date.parse(value);
  return isNaN(t) ? Infinity : t;
}

// Hands each material's FEFO batches out to the finished goods that need it:
// earliest-expiry batch first, each finished good taking up to its own
// requirement. A batch that spans two finished goods is split between them,
// and every line's remainingQty is what's left in that batch after that pick.
//
// Returns null when the split can't be done faithfully (a material that no
// finished good's section covers), so callers fall back to the combined view.
export function splitBatchAllocationsByFinishedGood(
  sections: FinishedGoodMaterialSection[],
  groups: BatchAllocationGroupData[],
): FinishedGoodBatchSection[] | null {
  const result: FinishedGoodBatchSection[] = sections.map((s) => ({
    finishedGood: s.finishedGood,
    groups: [],
  }));

  for (const group of groups) {
    if (!group.material) return null;
    const material = group.material;

    // Stable sort: unreadable/equal expiries keep the order they came in.
    const queue = group.lines
      .map((line, idx) => ({
        line,
        idx,
        left: line.batchQty,
        taken: 0,
        time: expiryTime(line.expiryDate),
      }))
      .sort((a, b) => a.time - b.time || a.idx - b.idx);

    let lastGroup: BatchAllocationGroupData | null = null;
    let cursor = 0;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      const fgMaterial = section.materials.find((m) => sameMaterial(m, material));
      if (!fgMaterial) continue;

      const lines: BatchAllocationLine[] = [];
      let need = fgMaterial.stockRequired;
      while (need > 0 && cursor < queue.length) {
        const entry = queue[cursor];
        const take = roundQty(Math.min(need, entry.left));
        if (take > 0) {
          entry.left = roundQty(entry.left - take);
          entry.taken = roundQty(entry.taken + take);
          need = roundQty(need - take);
          lines.push({
            ...entry.line,
            batchQty: take,
            remainingQty: roundQty(
              entry.line.remainingQty + (entry.line.batchQty - entry.taken),
            ),
          });
        }
        if (entry.left <= 0) cursor++;
      }

      const sectionGroup: BatchAllocationGroupData = {
        key: `${section.finishedGood.id}:${group.key}`,
        lines,
        material: fgMaterial,
        fallbackName: group.fallbackName,
      };
      result[sIdx].groups.push(sectionGroup);
      lastGroup = sectionGroup;
    }

    if (!lastGroup) return null;

    // Anything still unassigned (allocated more than the finished goods
    // need, e.g. a duplicated allocation) goes on the last finished good
    // that uses this material rather than silently disappearing.
    for (const entry of queue.slice(cursor)) {
      if (entry.left > 0) {
        lastGroup.lines.push({ ...entry.line, batchQty: entry.left });
      }
    }
  }

  return result;
}
