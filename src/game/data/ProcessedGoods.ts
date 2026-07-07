import type { ProcessedGoodDefinition, ProcessedGoodId } from '../models/ItemTypes';

export const PROCESSED_GOODS: Record<ProcessedGoodId, ProcessedGoodDefinition> = {
  flour: {
    id: 'flour',
    name: 'Flour'
  },
  bread: {
    id: 'bread',
    name: 'Bread'
  }
};
