import { PatternSparkline } from '../PatternSparkline';

export default function PatternSparklineExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
      <PatternSparkline
        name="Product Questions"
        count={142}
        trend="up"
        data={[10, 15, 13, 17, 20, 18, 22]}
        onClick={() => console.log('Pattern clicked')}
      />
      <PatternSparkline
        name="Billing Issues"
        count={38}
        trend="down"
        data={[15, 12, 14, 10, 8, 7, 5]}
      />
    </div>
  );
}
