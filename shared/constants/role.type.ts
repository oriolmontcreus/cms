export enum Roles {
  CLIENT = 1 << 0,                        // 1
  DEVELOPER = CLIENT | (1 << 1),          // 3
  SUPER_ADMIN = DEVELOPER | (1 << 2)      // 7
}