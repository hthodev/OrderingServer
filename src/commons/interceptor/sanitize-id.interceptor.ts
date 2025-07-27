import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Types } from 'mongoose';

@Injectable()
export class SanitizeIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transformResponse(data)));
  }

  private transformResponse(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.transformItem(item));
    }

    return this.transformItem(data);
  }

  private transformItem(item: any): any {
    if (Array.isArray(item)) {
      return item.map((i) => this.transformItem(i));
    }

    if (item && typeof item === 'object') {
      const newItem: Record<string, any> = {};

      for (const key in item) {
        const value = item[key];

        if (value instanceof Types.ObjectId) {
          newItem[key] = value.toString();
        } else if (Array.isArray(value)) {
          newItem[key] = value.map((v) => this.transformItem(v));
        } else if (
          value &&
          typeof value === 'object' &&
          !(value instanceof Date)
        ) {
          newItem[key] = this.transformItem(value);
        } else {
          newItem[key] = value;
        }
      }

      return newItem;
    }

    return item;
  }
}
