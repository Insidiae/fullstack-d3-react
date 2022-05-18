export interface DataRecord {
  [key: string]: string | number;
}

export interface Dimensions {
  height: number;
  width: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface BoundedDimensions extends Dimensions {
  boundedWidth: number;
  boundedHeight: number;
}

export type AccessorFunction<DataType> = (d: DataRecord) => DataType;
export type ScaledAccessorFunction = (d: DataRecord) => number;
