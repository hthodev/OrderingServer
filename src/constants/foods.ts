import { ObjectId } from "bson";

export default class FOOD {
  static readonly BANH_TRANG = {
    _id: "64bfbf1e8f2a4a0012d3abcd",
    name: "Bánh Tráng",
    price: 15000,
    unit: "cái",
  } as const;

  static readonly CATEGORY = {
    BIA: "Bia",
    KHAI_VI: "Món khai vị",
    DAC_BIET: "Đặc biệt",
    BINH_DAN: "Món bình dân",
    THUC_PHAM_THEM: "Thực phẩm thêm",
    NUOC: "Nước",
    BANH_TRANG: "Bánh tráng"
  } as const;
}

export type FoodCategory = typeof FOOD.CATEGORY[keyof typeof FOOD.CATEGORY];