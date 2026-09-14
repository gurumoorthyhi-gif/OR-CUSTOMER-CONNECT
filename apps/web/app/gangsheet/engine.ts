export type LayoutUnit = number;

export type GangsheetSettings = {
  sheetWidthInches: number;
  maxLengthInches: number;
  gapMm: number;
  marginMm: number;
  allowRotation: boolean;
  layoutMode?: GangsheetLayoutMode;
};

export type GangsheetLayoutMode = "compact" | "grouped";

export type GangsheetArtwork = {
  id: string;
  fileName: string;
  previewUrl: string;
  widthInches: number;
  heightInches: number;
  quantity: number;
};

export type GangsheetPlacement = {
  instanceId: string;
  artworkId: string;
  fileName: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  contentXmm: number;
  contentYmm: number;
  contentWidthMm: number;
  contentHeightMm: number;
  rotation: 0 | 90;
};

export type GangsheetResult = {
  settings: GangsheetSettings;
  sheetWidthMm: number;
  usedLengthMm: number;
  placements: GangsheetPlacement[];
  unplaced: GangsheetArtwork[];
  totalArtworkAreaMm2: number;
  materialAreaMm2: number;
  utilizationPercent: number;
  wastePercent: number;
  rotatedCount: number;
  totalPieces: number;
  valid: boolean;
  validationErrors: string[];
  pages: GangsheetPage[];
  pageCount: number;
};

export type GangsheetPage = {
  pageNumber: number;
  placements: GangsheetPlacement[];
  usedLengthMm: number;
  totalArtworkAreaMm2: number;
  materialAreaMm2: number;
  utilizationPercent: number;
  wastePercent: number;
  rotatedCount: number;
  valid: boolean;
  validationErrors: string[];
};

type Rect = { x: LayoutUnit; y: LayoutUnit; width: LayoutUnit; height: LayoutUnit };
type Instance = GangsheetArtwork & { instanceId: string; copyIndex: number; width: LayoutUnit; height: LayoutUnit; outerWidth: LayoutUnit; outerHeight: LayoutUnit };
type Candidate = { rect: Rect; width: LayoutUnit; height: LayoutUnit; rotation: 0 | 90; score: number[] };

const UNITS_PER_MM = 100;
const MM_PER_INCH = 25.4;

function mmToUnits(value: number) {
  return Math.round(value * UNITS_PER_MM);
}

function unitsToMm(value: number) {
  return Number((value / UNITS_PER_MM).toFixed(2));
}

function inchesToUnits(value: number) {
  return mmToUnits(value * MM_PER_INCH);
}

function positive(value: number) {
  return Number.isFinite(value) && value > 0;
}

function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function contains(outer: Rect, inner: Rect) {
  return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
}

function splitFreeRect(free: Rect, placed: Rect) {
  if (!intersects(free, placed)) return [free];
  const result: Rect[] = [];
  if (placed.x > free.x) result.push({ x: free.x, y: free.y, width: placed.x - free.x, height: free.height });
  if (placed.x + placed.width < free.x + free.width) result.push({ x: placed.x + placed.width, y: free.y, width: free.x + free.width - placed.x - placed.width, height: free.height });
  if (placed.y > free.y) result.push({ x: free.x, y: free.y, width: free.width, height: placed.y - free.y });
  if (placed.y + placed.height < free.y + free.height) result.push({ x: free.x, y: placed.y + placed.height, width: free.width, height: free.y + free.height - placed.y - placed.height });
  return result.filter((rect) => rect.width > 0 && rect.height > 0);
}

function splitFreeRectWithGap(free: Rect, placed: Rect, gap: LayoutUnit) {
  return splitFreeRect(free, { ...placed, width: placed.width + gap, height: placed.height + gap });
}

function pruneFreeRects(rects: Rect[]) {
  const unique = new Map<string, Rect>();
  rects.forEach((rect) => unique.set(`${rect.x}:${rect.y}:${rect.width}:${rect.height}`, rect));
  const values = [...unique.values()];
  return values.filter((rect, index) => !values.some((other, otherIndex) => index !== otherIndex && contains(other, rect)));
}

function compareScore(left: number[], right: number[]) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function buildInstances(artworks: GangsheetArtwork[]) {
  const instances: Instance[] = [];
  artworks.forEach((artwork) => {
    const quantity = Math.max(1, Math.floor(artwork.quantity));
    const width = inchesToUnits(artwork.widthInches);
    const height = inchesToUnits(artwork.heightInches);
    for (let copyIndex = 0; copyIndex < quantity; copyIndex += 1) {
      instances.push({
        ...artwork,
        instanceId: `${artwork.id}:${copyIndex + 1}`,
        copyIndex,
        width,
        height,
        outerWidth: width,
        outerHeight: height,
      });
    }
  });
  return instances;
}

function getOrientations(instance: Instance, allowRotation: boolean) {
  const orientations: Array<{ width: LayoutUnit; height: LayoutUnit; rotation: 0 | 90 }> = [{ width: instance.width, height: instance.height, rotation: 0 }];
  if (allowRotation && instance.width !== instance.height) orientations.push({ width: instance.height, height: instance.width, rotation: 90 });
  return orientations;
}

function createPlacement(instance: Instance, rect: Rect, rotation: 0 | 90) {
  const contentWidth = rotation === 0 ? instance.width : instance.height;
  const contentHeight = rotation === 0 ? instance.height : instance.width;
  return { instanceId: instance.instanceId, artworkId: instance.id, fileName: instance.fileName, xMm: unitsToMm(rect.x), yMm: unitsToMm(rect.y), widthMm: unitsToMm(rect.width), heightMm: unitsToMm(rect.height), contentXmm: unitsToMm(rect.x + (rect.width - contentWidth) / 2), contentYmm: unitsToMm(rect.y + (rect.height - contentHeight) / 2), contentWidthMm: unitsToMm(contentWidth), contentHeightMm: unitsToMm(contentHeight), rotation };
}

type GroupedBlock = { width: LayoutUnit; height: LayoutUnit; columns: number; rotation: 0 | 90; itemWidth: LayoutUnit; itemHeight: LayoutUnit };

function findGroupedBlock(group: Instance[], availableWidth: LayoutUnit, availableHeight: LayoutUnit, gap: LayoutUnit, allowRotation: boolean): GroupedBlock | null {
  const first = group[0];
  if (!first) return null;
  const options = getOrientations(first, allowRotation).map((orientation) => {
    const columns = Math.min(group.length, Math.max(1, Math.floor((availableWidth + gap) / (orientation.width + gap))));
    const rows = Math.ceil(group.length / columns);
    return { width: columns * orientation.width + Math.max(0, columns - 1) * gap, height: rows * orientation.height + Math.max(0, rows - 1) * gap, columns, rotation: orientation.rotation, itemWidth: orientation.width, itemHeight: orientation.height };
  }).filter((block) => block.width <= availableWidth && block.height <= availableHeight);
  return options.sort((left, right) => left.height - right.height || left.width - right.width)[0] ?? null;
}

function layoutGroupedPage(instances: Instance[], usableWidth: LayoutUnit, usableHeight: LayoutUnit, margin: LayoutUnit, gap: LayoutUnit, allowRotation: boolean) {
  const groups = new Map<string, Instance[]>();
  instances.forEach((instance) => {
    const key = `${instance.width}:${instance.height}`;
    groups.set(key, [...(groups.get(key) ?? []), instance]);
  });
  const orderedGroups = [...groups.values()].sort((left, right) => right[0].width * right[0].height - left[0].width * left[0].height);
  const placements: ReturnType<typeof createPlacement>[] = [];
  const placedInstances: Instance[] = [];
  const deferred: Instance[] = [];
  const unplaced: Instance[] = [];
  let x = margin;
  let y = margin;
  let rowHeight = 0;
  let currentUsedBottom = margin;

  orderedGroups.forEach((group) => {
    let block = findGroupedBlock(group, usableWidth - (x - margin), usableHeight - (y - margin), gap, allowRotation);
    if (!block && x > margin) {
      y += rowHeight + gap;
      x = margin;
      rowHeight = 0;
      block = findGroupedBlock(group, usableWidth, usableHeight - (y - margin), gap, allowRotation);
    }
    if (!block) {
      if (findGroupedBlock(group, usableWidth, usableHeight, gap, allowRotation)) deferred.push(...group);
      else unplaced.push(...group);
      return;
    }

    group.forEach((instance, index) => {
      const column = index % block.columns;
      const row = Math.floor(index / block.columns);
      const rect = { x: x + column * (block.itemWidth + gap), y: y + row * (block.itemHeight + gap), width: block.itemWidth, height: block.itemHeight };
      placements.push(createPlacement(instance, rect, block.rotation));
      placedInstances.push(instance);
      currentUsedBottom = Math.max(currentUsedBottom, rect.y + rect.height);
    });
    x += block.width + gap;
    rowHeight = Math.max(rowHeight, block.height);
  });

  return { placements, placedInstances, deferred, unplaced, currentUsedBottom };
}

function validatePlacements(placements: GangsheetPlacement[], sheetWidth: LayoutUnit, usableHeight: LayoutUnit, margins: LayoutUnit) {
  const errors: string[] = [];
  placements.forEach((placement) => {
    const rect = { x: mmToUnits(placement.xMm), y: mmToUnits(placement.yMm), width: mmToUnits(placement.widthMm), height: mmToUnits(placement.heightMm) };
    if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) errors.push(`Invalid placement ${placement.instanceId}.`);
    if (rect.x < margins || rect.x + rect.width > sheetWidth - margins || rect.y < margins || rect.y + rect.height > margins + usableHeight) errors.push(`Placement ${placement.instanceId} exceeds printable boundaries.`);
  });
  for (let left = 0; left < placements.length; left += 1) {
    const a = placements[left];
    const rectA = { x: mmToUnits(a.xMm), y: mmToUnits(a.yMm), width: mmToUnits(a.widthMm), height: mmToUnits(a.heightMm) };
    for (let right = left + 1; right < placements.length; right += 1) {
      const b = placements[right];
      const rectB = { x: mmToUnits(b.xMm), y: mmToUnits(b.yMm), width: mmToUnits(b.widthMm), height: mmToUnits(b.heightMm) };
      if (intersects(rectA, rectB)) errors.push(`Placements ${a.instanceId} and ${b.instanceId} overlap.`);
    }
  }
  return errors;
}

export function generateGangsheet(artworks: GangsheetArtwork[], settings: GangsheetSettings): GangsheetResult {
  const effectiveSettings: GangsheetSettings = { sheetWidthInches: 22.6, maxLengthInches: 100, gapMm: 5, marginMm: 0, allowRotation: true, layoutMode: settings.layoutMode ?? "compact" };
  const sheetWidth = inchesToUnits(effectiveSettings.sheetWidthInches);
  const maxLengthInches = effectiveSettings.maxLengthInches;
  const gap = mmToUnits(effectiveSettings.gapMm);
  const margin = mmToUnits(effectiveSettings.marginMm);
  const usableWidth = sheetWidth - margin * 2;
  const usableHeight = inchesToUnits(maxLengthInches) - margin * 2;
  const instances = buildInstances(artworks).sort((left, right) => {
    const areaDiff = right.outerWidth * right.outerHeight - left.outerWidth * left.outerHeight;
    if (areaDiff) return areaDiff;
    const sideDiff = Math.max(right.outerWidth, right.outerHeight) - Math.max(left.outerWidth, left.outerHeight);
    if (sideDiff) return sideDiff;
    return left.instanceId.localeCompare(right.instanceId);
  });

  const invalidSettings = usableWidth <= 0 || usableHeight <= 0;
  if (invalidSettings) {
    const validationErrors = [usableWidth <= 0 ? "The sheet width is smaller than its margins." : "The maximum page length is too small for its margins."];
    return { settings: effectiveSettings, sheetWidthMm: unitsToMm(sheetWidth), usedLengthMm: 0, placements: [], unplaced: artworks, totalArtworkAreaMm2: 0, materialAreaMm2: 0, utilizationPercent: 0, wastePercent: 100, rotatedCount: 0, totalPieces: instances.length, valid: false, validationErrors, pages: [], pageCount: 0 };
  }

  const pages: GangsheetPage[] = [];
  let remaining = instances;
  const unplacedInstances: Instance[] = [];
  let pageNumber = 1;

  while (remaining.length) {
    const freeRects: Rect[] = [{ x: margin, y: margin, width: usableWidth, height: usableHeight }];
    const placements: GangsheetPlacement[] = [];
    const placedInstances: Instance[] = [];
    const deferred: Instance[] = [];
    let currentUsedBottom = margin;

    if (effectiveSettings.layoutMode === "grouped") {
      const groupedPage = layoutGroupedPage(remaining, usableWidth, usableHeight, margin, gap, effectiveSettings.allowRotation);
      placements.push(...groupedPage.placements);
      placedInstances.push(...groupedPage.placedInstances);
      deferred.push(...groupedPage.deferred);
      unplacedInstances.push(...groupedPage.unplaced);
      currentUsedBottom = groupedPage.currentUsedBottom;
    } else {
      remaining.forEach((instance) => {
        const orientations = getOrientations(instance, effectiveSettings.allowRotation);
        const fitsOnPage = orientations.some((orientation) => orientation.width <= usableWidth && orientation.height <= usableHeight);
        if (!fitsOnPage) {
          unplacedInstances.push(instance);
          return;
        }

        const candidates: Candidate[] = [];
        freeRects.forEach((free) => orientations.forEach((orientation) => {
          if (orientation.width > free.width || orientation.height > free.height) return;
          const bottom = free.y + orientation.height;
          candidates.push({ rect: { x: free.x, y: free.y, width: orientation.width, height: orientation.height }, ...orientation, score: [Math.max(0, bottom - currentUsedBottom), free.width * free.height - orientation.width * orientation.height, Math.min(free.width - orientation.width, free.height - orientation.height), free.y, free.x, orientation.rotation] });
        }));

        if (!candidates.length) {
          deferred.push(instance);
          return;
        }
        candidates.sort((left, right) => compareScore(left.score, right.score));
        const chosen = candidates[0];
        freeRects.splice(0, freeRects.length, ...pruneFreeRects(freeRects.flatMap((free) => splitFreeRectWithGap(free, chosen.rect, gap))));
        currentUsedBottom = Math.max(currentUsedBottom, chosen.rect.y + chosen.rect.height);
        placements.push(createPlacement(instance, chosen.rect, chosen.rotation));
        placedInstances.push(instance);
      });
    }

    if (!placements.length) {
      unplacedInstances.push(...deferred);
      break;
    }

    const usedHeight = Math.min(inchesToUnits(maxLengthInches), currentUsedBottom + margin);
    const totalArtworkArea = placedInstances.reduce((sum, instance) => sum + instance.width * instance.height, 0);
    const materialArea = sheetWidth * usedHeight;
    const validationErrors = validatePlacements(placements, sheetWidth, Math.max(0, usedHeight - margin * 2), margin);
    const utilizationPercent = materialArea ? Number((totalArtworkArea / materialArea * 100).toFixed(1)) : 0;
    pages.push({ pageNumber, placements, usedLengthMm: unitsToMm(usedHeight), totalArtworkAreaMm2: totalArtworkArea / 10000, materialAreaMm2: materialArea / 10000, utilizationPercent, wastePercent: Number(Math.max(0, 100 - utilizationPercent).toFixed(1)), rotatedCount: placements.filter((placement) => placement.rotation === 90).length, valid: !validationErrors.length, validationErrors });
    remaining = deferred;
    pageNumber += 1;
  }

  const unplaced = unplacedInstances.map((instance) => artworks.find((artwork) => artwork.id === instance.id) ?? instance);
  const uniqueUnplaced = [...new Map(unplaced.map((artwork) => [artwork.id, artwork])).values()];
  const allArtworkArea = instances.reduce((sum, instance) => sum + instance.width * instance.height, 0);
  const allValidationErrors = pages.flatMap((page) => page.validationErrors.map((error) => `Page ${page.pageNumber}: ${error}`));
  const totalMaterialAreaMm2 = pages.reduce((sum, page) => sum + page.materialAreaMm2, 0);
  const utilizationPercent = totalMaterialAreaMm2 ? Number((allArtworkArea / 10000 / totalMaterialAreaMm2 * 100).toFixed(1)) : 0;
  const firstPage = pages[0];
  return { settings: effectiveSettings, sheetWidthMm: unitsToMm(sheetWidth), usedLengthMm: firstPage?.usedLengthMm ?? 0, placements: firstPage?.placements ?? [], unplaced: uniqueUnplaced, totalArtworkAreaMm2: allArtworkArea / 10000, materialAreaMm2: totalMaterialAreaMm2, utilizationPercent, wastePercent: Number(Math.max(0, 100 - utilizationPercent).toFixed(1)), rotatedCount: pages.reduce((sum, page) => sum + page.rotatedCount, 0), totalPieces: instances.length, valid: !uniqueUnplaced.length && !allValidationErrors.length, validationErrors: allValidationErrors, pages, pageCount: pages.length };
}
