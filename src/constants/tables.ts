export default class TABLE {
  static readonly TYPE = {
    OFFICIAL: 'OFFICIAL',
    EXTENDED: 'EXTENDED',
  } as const;
}

export type TableType = typeof TABLE.TYPE[keyof typeof TABLE.TYPE];