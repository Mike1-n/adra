/**
 * South Sudan Location Service & Data Store
 * Dynamically loaded from external JSON data store (src/data/southSudanLocations.json)
 * Decoupled from views - not hardcoded into any component
 */
import locationsData from '../data/southSudanLocations.json';

export const SOUTH_SUDAN_LOCATIONS = locationsData;

/**
 * Get all available states
 */
export function getStates() {
  return Object.keys(SOUTH_SUDAN_LOCATIONS);
}

/**
 * Get all counties for a selected state
 */
export function getCounties(stateName) {
  if (!stateName || !SOUTH_SUDAN_LOCATIONS[stateName]) {
    return [];
  }
  return Object.keys(SOUTH_SUDAN_LOCATIONS[stateName]);
}

/**
 * Get all payams for a selected state and county
 */
export function getPayams(stateName, countyName) {
  if (!stateName || !countyName || !SOUTH_SUDAN_LOCATIONS[stateName]?.[countyName]) {
    return [];
  }
  return Object.keys(SOUTH_SUDAN_LOCATIONS[stateName][countyName]);
}

/**
 * Get all bomas for a selected state, county and payam
 */
export function getBomas(stateName, countyName, payamName) {
  if (
    !stateName ||
    !countyName ||
    !payamName ||
    !SOUTH_SUDAN_LOCATIONS[stateName]?.[countyName]?.[payamName]
  ) {
    return ['Central Boma', 'Other'];
  }
  const bomas = SOUTH_SUDAN_LOCATIONS[stateName][countyName][payamName];
  return bomas.length > 0 ? bomas : ['Central Boma'];
}
