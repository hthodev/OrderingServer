import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument } from './tables.schema';

@Injectable()
export class TableService {
  constructor(
    @InjectModel(Table.name)
    private tableModel: Model<TableDocument>,
  ) {}

  async tableList() {
    return await this.tableModel.find().lean();
  }

  async havingGuests(isGuest, _id, session) {
    return await this.tableModel.updateOne(
      { _id },
      { $set: { havingGuests: isGuest } },
      { session },
    );
  }
}
