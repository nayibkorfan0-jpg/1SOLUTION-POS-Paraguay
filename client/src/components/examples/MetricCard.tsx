import { MetricCard } from '../MetricCard';
import { DollarSign, Car, Users, Package } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <MetricCard
        title="Ventas de Hoy"
        value="Gs. 1.250.000"
        icon={<DollarSign />}
        trend={{ value: '+12%', type: 'up' }}
      />
      <MetricCard
        title="Servicios Realizados"
        value="23"
        icon={<Car />}
        trend={{ value: '+5', type: 'up', label: 'vs ayer' }}
      />
      <MetricCard
        title="Clientes Atendidos"
        value="18"
        icon={<Users />}
        trend={{ value: '+3', type: 'up', label: 'nuevos' }}
      />
      <MetricCard
        title="Stock Crítico"
        value="4"
        icon={<Package />}
        trend={{ value: 'Productos', type: 'down' }}
      />
    </div>
  );
}