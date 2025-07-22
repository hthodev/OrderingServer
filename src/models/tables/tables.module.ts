import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Table, TableSchema } from './tables.schema';
import { TableService } from './tables.service';
import { TableController } from './tables.controller';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Table.name, schema: TableSchema },
    ]),
  ],
  providers: [TableService],
  controllers: [TableController],
  exports: [TableService],
})
export class TableModule {}