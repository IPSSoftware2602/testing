const fs = require('fs');

const checks = [
  {
    file: '/Users/chongcy/Documents/USPizza/USPizza_new_app/app/screens/home/index.js',
    patterns: [
      'await handleSetOrderType(type);',
      'await handleSetOrderType("dinein");',
      'await handleSetOrderType("pickup");',
      'await handleSetOrderType("delivery");',
    ],
  },
  {
    file: '/Users/chongcy/Documents/USPizza/USPizza_new_app/app/screens/menu/index.js',
    patterns: [
      "const [activeOrderType, setActiveOrderType] = useState('');",
      "const storedOrderType = await AsyncStorage.getItem('orderType');",
      "if (storedOrderType && VALID_ORDER_TYPES.has(String(storedOrderType))) {",
    ],
  },
  {
    file: '/Users/chongcy/Documents/USPizza/USPizza_new_app/components/ui/CustomTabBar.jsx',
    patterns: [
      'const handleOrderTypeSelect = async (type) => {',
      'await handleSetOrderType(type);',
    ],
  },
];

const missing = [];

for (const check of checks) {
  const content = fs.readFileSync(check.file, 'utf8');

  for (const pattern of check.patterns) {
    if (!content.includes(pattern)) {
      missing.push(`${check.file} missing pattern: ${pattern}`);
    }
  }
}

if (missing.length > 0) {
  console.error('Order type navigation contract failed:');
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log('Order type navigation contract passed.');
