export const API_KEYS = [
    "decorate",
    "metadata",
    "defineMetadata",
    "hasMetadata",
    "hasOwnMetadata",
    "getMetadata",
    "getOwnMetadata",
    "getMetadataKeys",
    "getOwnMetadataKeys",
    "deleteMetadata"
] as const;

export type ReflectApiType = Pick<typeof globalThis.Reflect, typeof API_KEYS[number]>;
