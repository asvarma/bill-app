import type { TradeTemplate } from '../types';
import fabrication from './fabrication.json';
import electrician from './electrician.json';
import plumber from './plumber.json';
import carpenter from './carpenter.json';
import general from './general.json';
import generalStore from './generalStore.json';
import retailer from './retailer.json';
import electronicsShop from './electronicsShop.json';
import hardwareStore from './hardwareStore.json';

export const tradeTemplates: TradeTemplate[] = [
  fabrication,
  electrician,
  plumber,
  carpenter,
  general,
  generalStore,
  retailer,
  electronicsShop,
  hardwareStore,
];

export function getTradeTemplate(key: string): TradeTemplate | undefined {
  return tradeTemplates.find((template) => template.key === key);
}
