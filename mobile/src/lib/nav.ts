import type { NavigationProp } from '@react-navigation/native';

export function openShopTab(
  navigation: NavigationProp<Record<string, object | undefined>>,
) {
  const parent = navigation.getParent();
  if (parent) {
    parent.navigate('ShopTab' as never);
    return;
  }
  navigation.navigate('ShopTab' as never);
}

export function openStaffHome(
  navigation: NavigationProp<Record<string, object | undefined>>,
) {
  const parent = navigation.getParent();
  if (parent) {
    parent.navigate('StaffTab' as never);
    return;
  }
  navigation.navigate('StaffTab' as never);
}
