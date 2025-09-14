import { InventoryAlerts } from '../InventoryAlerts';

export default function InventoryAlertsExample() {
  const mockItems = [
    {
      id: '1',
      name: 'Shampoo para Autos',
      currentStock: 5,
      minStock: 10,
      unit: 'litros',
      supplier: 'AutoLimpieza S.A.',
      lastOrder: '15/01/2024',
      status: 'critico' as const
    },
    {
      id: '2',
      name: 'Paños de Microfibra',
      currentStock: 12,
      minStock: 20,
      unit: 'unidades',
      supplier: 'Textiles del Este',
      lastOrder: '10/01/2024',
      status: 'bajo' as const
    },
    {
      id: '3',
      name: 'Cera Líquida',
      currentStock: 2,
      minStock: 8,
      unit: 'litros',
      supplier: 'AutoLimpieza S.A.',
      lastOrder: '08/01/2024',
      status: 'critico' as const
    },
    {
      id: '4',
      name: 'Desinfectante',
      currentStock: 8,
      minStock: 15,
      unit: 'litros',
      supplier: 'Químicos Paraguay',
      lastOrder: '12/01/2024',
      status: 'bajo' as const
    }
  ];

  return (
    <div className="max-w-4xl">
      <InventoryAlerts
        items={mockItems}
        totalProducts={24}
        criticalCount={2}
        lowCount={2}
      />
    </div>
  );
}