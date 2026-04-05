export const stories = [
  { id: 1, name: 'Matilda', avatar: 'https://i.pravatar.cc/80?img=47', seen: false, action: 'shared a cuppa ☕', isSponsored: false },
  { id: 2, name: 'James', avatar: 'https://i.pravatar.cc/80?img=12', seen: false, action: 'nailed the ratio 🎯', isSponsored: false },
  { id: 3, name: 'Priya', avatar: 'https://i.pravatar.cc/80?img=49', seen: true, action: 'morning ritual ✨', isSponsored: false },
  { id: 4, name: 'Cafe Nomad', avatar: 'https://i.pravatar.cc/80?img=3', seen: false, action: '☕ Single origin drop', isSponsored: true },
  { id: 5, name: 'Leo', avatar: 'https://i.pravatar.cc/80?img=7', seen: false, action: 'first brew of 2026 🎉', isSponsored: false },
  { id: 6, name: 'Yuki', avatar: 'https://i.pravatar.cc/80?img=25', seen: true, action: 'V60 Friday 🫗', isSponsored: false },
];

export const recentBrews = [
  { id: 1, label: "Yday's Caf", sub: 'Breville · Ethiopia Yirgacheffe · 18g in / 36g out', time: 'Yesterday 7:02am', img: 'https://picsum.photos/seed/lattecup44/800/450', rating: 4, method: 'Espresso' },
  { id: 2, label: 'Tue Morn Latte', sub: 'Breville · Colombia Huila · 18g in / 38g out', time: 'Tue 7:14am', img: 'https://picsum.photos/seed/milkcoffee8/800/450', rating: 5, method: 'Latte' },
  { id: 3, label: 'Mon Espresso', sub: 'Breville · Sumatra · 18g in / 32g out', time: 'Mon 6:50am', img: 'https://picsum.photos/seed/doubleshot2/800/450', rating: 3, method: 'Espresso' },
  { id: 4, label: 'Sun Pour Over', sub: 'C40 · Kenya AA · 20g in / 300g out', time: 'Sun 9:31am', img: 'https://picsum.photos/seed/pourover66/800/450', rating: 5, method: 'Pour Over' },
];

export const beans = [
  { id: 1, name: 'Ethiopia Yirgacheffe', roaster: 'Single O', roast: 'Light', notes: 'Blueberry · Jasmine', stock: 450, max: 500, color: '#C4813A' },
  { id: 2, name: 'Colombian Huila', roaster: 'Market Lane', roast: 'Medium', notes: 'Caramel · Citrus', stock: 210, max: 500, color: '#8B5E34' },
  { id: 3, name: 'Sumatra Mandheling', roaster: 'Seven Seeds', roast: 'Dark', notes: 'Earthy · Cedar', stock: 80, max: 500, color: '#4A2E10' },
  { id: 4, name: 'Kenya AA', roaster: 'Proud Mary', roast: 'Light-Med', notes: 'Tomato · Currant', stock: 320, max: 500, color: '#B87340' },
];

export const brewGradients = [
  ['#6B3F1E', '#C4813A', '#E8C97A'],
  ['#3D2008', '#8B5E34', '#D4A96A'],
  ['#1E0F04', '#5C3317', '#A86830'],
  ['#5A3E1B', '#B8834A', '#EDD49C'],
];

export type Story = typeof stories[number];
export type Brew = typeof recentBrews[number];
export type Bean = typeof beans[number];
