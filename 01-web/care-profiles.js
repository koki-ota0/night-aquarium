// Food groups are simplified game choices, NOT instructions for real animals.
// Each active species provides its own food list and representative size in
// data/real-catalog-data.json; see SPECIES_REVIEW.md for reference links.
export const FOODS=[
 {id:'plankton',label:'小さなプランクトン',short:'プランクトン',detail:'動物プランクトン・小さな甲殻類など',color:0xf2cb83},
 {id:'insects',label:'小さな虫',short:'小さな虫',detail:'水生昆虫・落下した小昆虫など',color:0xcb9870},
 {id:'seafood',label:'小魚・貝・甲殻類',short:'小魚・貝',detail:'小魚・貝・エビなど',color:0xffb08b},
 {id:'plants',label:'水草・海草・藻',short:'水草・海藻',detail:'水草・海草・藻類のグループ',color:0xa9d395},
 {id:'special',label:'専用食',short:'専用食',detail:'海綿や浮遊性巻貝など、種類に合わせた特別なえさ',color:0xdba7d6}
];
export const FOOD_BY_ID=Object.fromEntries(FOODS.map(x=>[x.id,x]));
export const AUTO_FOOD={id:'auto',short:'おまかせ',label:'おまかせミックス'};
export function careProfile(sp){
 const foods=Array.isArray(sp?.food)&&sp.food.length?sp.food:['special'];
 return {cm:sp?.referenceCm??0,unit:sp?.referenceUnit||'体の大きさ',foods,favorite:foods[0]};
}
export function canEat(sp,food){return !!sp&&sp.kind!=='environment'&&careProfile(sp).foods.includes(food);}
export function resolvedFood(sp,selection){return selection===AUTO_FOOD.id&&sp&&sp.kind!=='environment'?careProfile(sp).favorite:selection;}
export function canServe(sp,selection){return canEat(sp,resolvedFood(sp,selection));}
