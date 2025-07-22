import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');

function convertDates(obj: any): any {
  if (obj instanceof Date) {
    return dayjs(obj).tz().format(); // ISO UTC+7
  } else if (Array.isArray(obj)) {
    return obj.map(convertDates);
  } else if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const key of Object.keys(obj)) {
      converted[key] = convertDates(obj[key]);
    }
    return converted;
  }
  return obj;
}

@Injectable()
export class DateTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(map((data) => convertDates(data)));
  }
}
