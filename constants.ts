import { NodeData } from './types';

export const GUITAR_DATA: NodeData = {
  id: 'root',
  label: 'Electric Guitars (电吉他)',
  type: 'root',
  children: [
    {
      id: 'fender',
      label: 'Fender (芬达)',
      type: 'brand',
      brand: 'Fender',
      children: [
        {
          id: 'strat',
          label: 'Stratocaster',
          type: 'model',
          brand: 'Fender',
          data: { id: 'strat', name: 'Fender Stratocaster', brand: 'Fender' }
        },
        {
          id: 'tele',
          label: 'Telecaster',
          type: 'model',
          brand: 'Fender',
          data: { id: 'tele', name: 'Fender Telecaster', brand: 'Fender' }
        },
        {
          id: 'jazz',
          label: 'Jazzmaster',
          type: 'model',
          brand: 'Fender',
          data: { id: 'jazz', name: 'Fender Jazzmaster', brand: 'Fender' }
        }
      ]
    },
    {
      id: 'gibson',
      label: 'Gibson (吉普森)',
      type: 'brand',
      brand: 'Gibson',
      children: [
        {
          id: 'lp',
          label: 'Les Paul',
          type: 'model',
          brand: 'Gibson',
          data: { id: 'lp', name: 'Gibson Les Paul', brand: 'Gibson' }
        },
        {
          id: 'sg',
          label: 'SG',
          type: 'model',
          brand: 'Gibson',
          data: { id: 'sg', name: 'Gibson SG', brand: 'Gibson' }
        },
        {
          id: '335',
          label: 'ES-335',
          type: 'model',
          brand: 'Gibson',
          data: { id: '335', name: 'Gibson ES-335', brand: 'Gibson' }
        }
      ]
    }
  ]
};
