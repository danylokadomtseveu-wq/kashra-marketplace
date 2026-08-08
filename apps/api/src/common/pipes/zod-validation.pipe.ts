import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common"
import type { ZodType } from "zod"
import { ValidationApiError } from "../errors/api-error.js"

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }))
      throw new ValidationApiError("Некорректные данные", details)
    }
    return result.data
  }
}
