export default class USER {
  static readonly POSITION = {
    STAFF: 'STAFF',
    OWNER: 'OWNER',
    MANAGER: 'MANAGER',
    COOKING: 'COOKING'
  } as const;
}

export type UserPosition = typeof USER.POSITION[keyof typeof USER.POSITION];