import { api } from '@/services/api';

export const testApiAuthentication = async () => {
  console.log('=== Testing API Authentication ===');
  
  try {
    console.log('Testing /api/v1/users/profile...');
    const profile = await api.getProfile();
    console.log('✅ Profile API successful:', profile);
    return true;
  } catch (error) {
    console.log('❌ Profile API failed:', error);
  }
  
  try {
    console.log('Testing /api/v1/preferences/...');
    const preferences = await api.getUserPreferences();
    console.log('✅ Preferences API successful:', preferences);
    return true;
  } catch (error) {
    console.log('❌ Preferences API failed:', error);
  }
  
  try {
    console.log('Testing /api/v1/readings/latest/water...');
    const waterReading = await api.getLatestReading('water');
    console.log('✅ Water readings API successful:', waterReading);
    return true;
  } catch (error) {
    console.log('❌ Water readings API failed:', error);
  }
  
  console.log('=== All API tests failed ===');
  return false;
};