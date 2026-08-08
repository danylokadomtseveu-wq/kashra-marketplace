import type { ZodType } from "zod"

export const ZOD_SCHEMA_KEY = "zod:schema"

export const ZodBody = (schema: ZodType): ParameterDecorator =>
  (target, propertyKey, parameterIndex) => {
    if (propertyKey !== undefined) {
      Reflect.defineMetadata(ZOD_SCHEMA_KEY, schema, target, propertyKey)
    } else {
      Reflect.defineMetadata(ZOD_SCHEMA_KEY, schema, target)
    }
    void parameterIndex
  }
