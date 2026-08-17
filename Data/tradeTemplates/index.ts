import type { TradeTemplate } from '../types';
import fabrication from './fabrication.json';
import electrician from './electrician.json';
import plumber from './plumber.json';
import carpenter from './carpenter.json';
import general from './general.json';

export const tradeTemplates: TradeTemplate[] = [
  fabrication,
  electrician,
  plumber,
  carpenter,
  general,
];

export function getTradeTemplate(key: string): TradeTemplate | undefined {
  return tradeTemplates.find((template) => template.key === key);
}
