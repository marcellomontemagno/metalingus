import type Grade from "@/lib/model/Grade";
import type Shape from "@/lib/model/Shape";

const SHAPE_PREFIXES: Record<Shape, string> = {
  SQUARE: "TQ",
  RECTANGULAR: "TR",
  ROUND: "TC",
};

export default function createCode(item: {
  grade: Grade;
  shape: Shape;
  width: number;
  height: number;
  thickness: number;
}): string {
  const { grade, shape, width, height, thickness } = item;

  const shapePrefix = SHAPE_PREFIXES[shape] ?? "TC";
  const materialSuffix = grade === "S235JR" ? "N" : "Z";

  const dims =
    shape === "RECTANGULAR"
      ? `${width}${height}SP${thickness}`
      : `${height}SP${thickness}`;

  return shapePrefix + materialSuffix + dims;
}
