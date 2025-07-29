import FOOD from 'src/constants/foods';

export function exceptionCategory(category) {
  return [
    FOOD.CATEGORY.BIA,
    FOOD.CATEGORY.NUOC,
    FOOD.CATEGORY.BANH_TRANG,
    FOOD.CATEGORY.THUC_PHAM_THEM,
  ].includes(category);
}
