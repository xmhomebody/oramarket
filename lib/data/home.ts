// 首页静态数据（从原站 index.html 完整移植，内容保持不变）
// 决策：Supabase 仅占位，数据继续以前端静态形式提供（也通过 Hono API 暴露）。

// 头像底色池
export const AV_COLORS: string[] = ['#1E40AF','#DC2626','#16A34A','#7C3AED','#D97706','#0891B2','#BE185D','#B45309'];

// 排行榜数据：按 日/周/月/年 四个周期
export interface LbItem { n: string; pts: string; acc: string; c: string }
export const LB: Record<"day" | "week" | "month" | "year", LbItem[]> = {
  day:[
    {n:'风中追风',pts:'+4,100',acc:'94%',c:'#DC2626'},
    {n:'小确幸',pts:'+3,200',acc:'91%',c:'#1E40AF'},
    {n:'老顽童',pts:'+2,800',acc:'88%',c:'#16A34A'},
    {n:'月半小夜曲',pts:'+2,250',acc:'86%',c:'#7C3AED'},
    {n:'数据控',pts:'+1,900',acc:'83%',c:'#D97706'},
    {n:'一颗柠檬',pts:'+1,650',acc:'81%',c:'#0891B2'},
    {n:'神预测家',pts:'+1,400',acc:'79%',c:'#BE185D'},
    {n:'林深见鹿',pts:'+1,100',acc:'77%',c:'#1E40AF'},
    {n:'摸鱼达人',pts:'+950',acc:'75%',c:'#DC2626'},
    {n:'布朗尼',pts:'+800',acc:'73%',c:'#16A34A'}
  ],
  week:[
    {n:'月半小夜曲',pts:'+18,400',acc:'92%',c:'#7C3AED'},
    {n:'风中追风',pts:'+15,200',acc:'89%',c:'#DC2626'},
    {n:'小确幸',pts:'+13,700',acc:'87%',c:'#1E40AF'},
    {n:'罗小胖',pts:'+11,500',acc:'85%',c:'#D97706'},
    {n:'老顽童',pts:'+9,800',acc:'83%',c:'#16A34A'},
    {n:'一颗柠檬',pts:'+8,300',acc:'81%',c:'#0891B2'},
    {n:'麦克老刘',pts:'+7,100',acc:'79%',c:'#1E40AF'},
    {n:'神预测家',pts:'+6,200',acc:'77%',c:'#BE185D'},
    {n:'南柯一梦',pts:'+5,400',acc:'75%',c:'#D97706'},
    {n:'数据控',pts:'+4,800',acc:'73%',c:'#7C3AED'}
  ],
  month:[
    {n:'罗小胖',pts:'+67,200',acc:'93%',c:'#D97706'},
    {n:'月半小夜曲',pts:'+58,900',acc:'90%',c:'#7C3AED'},
    {n:'风中追风',pts:'+52,100',acc:'88%',c:'#DC2626'},
    {n:'小确幸',pts:'+48,600',acc:'86%',c:'#1E40AF'},
    {n:'老顽童',pts:'+41,300',acc:'84%',c:'#16A34A'},
    {n:'一颗柠檬',pts:'+36,700',acc:'82%',c:'#0891B2'},
    {n:'麦克老刘',pts:'+31,200',acc:'80%',c:'#1E40AF'},
    {n:'林深见鹿',pts:'+27,900',acc:'78%',c:'#1E40AF'},
    {n:'神预测家',pts:'+23,500',acc:'76%',c:'#BE185D'},
    {n:'南柯一梦',pts:'+19,800',acc:'74%',c:'#D97706'}
  ],
  year:[
    {n:'小确幸',pts:'+284,600',acc:'95%',c:'#1E40AF'},
    {n:'罗小胖',pts:'+247,300',acc:'92%',c:'#D97706'},
    {n:'风中追风',pts:'+218,900',acc:'90%',c:'#DC2626'},
    {n:'月半小夜曲',pts:'+196,400',acc:'88%',c:'#7C3AED'},
    {n:'老顽童',pts:'+175,200',acc:'86%',c:'#16A34A'},
    {n:'麦克老刘',pts:'+152,800',acc:'84%',c:'#1E40AF'},
    {n:'一颗柠檬',pts:'+138,500',acc:'82%',c:'#0891B2'},
    {n:'林深见鹿',pts:'+124,100',acc:'80%',c:'#1E40AF'},
    {n:'南柯一梦',pts:'+109,700',acc:'78%',c:'#D97706'},
    {n:'数据控',pts:'+98,300',acc:'76%',c:'#7C3AED'}
  ]
};

// 地区参与占比
export interface RegionItem { key: string; pct: number; pts: string; users: string }
export const REGIONS: RegionItem[] = [
  {key:'region_gd', pct:24, pts:'3,450,200', users:'45,210'},
  {key:'region_js', pct:18, pts:'2,580,100', users:'34,180'},
  {key:'region_zj', pct:15, pts:'2,150,400', users:'28,450'},
  {key:'region_sd', pct:12, pts:'1,720,300', users:'22,760'},
  {key:'region_hn', pct:9, pts:'1,290,200', users:'17,070'},
  {key:'region_sc', pct:7, pts:'1,003,500', users:'13,280'},
  {key:'region_hb', pct:6, pts:'860,100', users:'11,380'},
  {key:'region_hn2', pct:4, pts:'573,400', users:'7,590'},
  {key:'region_sh', pct:3, pts:'430,100', users:'5,690'},
  {key:'region_bj', pct:2, pts:'286,700', users:'3,790'}
];

// 侧栏调研项（最新 / 热门）
export interface SideSurvey { id: number; key: string; pool: string; y: number; oY: string; oN: string }
export const LATEST_SURVEYS: SideSurvey[] = [
  { id: 24, key: 'lp1', pool: '12K', y: 58, oY: '1.72', oN: '2.38' },
  { id: 25, key: 'lp2', pool: '8K',  y: 37, oY: '2.70', oN: '1.58' },
  { id: 26, key: 'lp3', pool: '21K', y: 71, oY: '1.40', oN: '3.44' },
  { id: 22, key: 'lp4', pool: '45K', y: 82, oY: '1.21', oN: '5.55' },
  { id: 23, key: 'lp5', pool: '9K',  y: 46, oY: '2.17', oN: '1.85' },
];
export const HOT_SURVEYS: SideSurvey[] = [
  { id: 1,  key: 'hp1', pool: '124K', y: 66, oY: '1.51', oN: '2.94' },
  { id: 7,  key: 'hp2', pool: '89K',  y: 41, oY: '2.43', oN: '1.69' },
  { id: 13, key: 'hp3', pool: '75K',  y: 53, oY: '1.88', oN: '2.12' },
  { id: 5,  key: 'hp4', pool: '62K',  y: 79, oY: '1.26', oN: '4.76' },
  { id: 11, key: 'hp5', pool: '51K',  y: 28, oY: '3.57', oN: '1.38' },
];

// 三个热门话题卡片
export interface HotTopic { nameKey: string; pool: number; inc: number; pct: number; c: string }
export const HOT_TOPICS: HotTopic[] = [
  {nameKey:'htc_healthcare',pool:248000,inc:1820,pct:4.2,c:'#DC2626'},
  {nameKey:'htc_climate',pool:312600,inc:2410,pct:5.6,c:'#16A34A'},
  {nameKey:'htc_education',pool:142800,inc:1240,pct:3.1,c:'#1E40AF'}
];

// 精选调研轮播的趋势折线图数据
export const TREND_DATES: string[] = ['05-23','05-24','05-25','05-26','05-27','05-28','05-29','05-30','05-31','06-01','06-02','06-03'];
export const TRENDS: number[][] = [
  [52,58,54,61,56,63,59,66,61,68,64,67],
  [56,51,57,49,54,47,52,45,49,43,47,45],
  [43,49,45,51,47,54,49,55,50,56,51,52],
  [51,45,49,42,47,40,45,38,43,36,40,38],
  [60,66,62,69,64,71,66,73,68,74,69,71]
];

// 实时兑换：用户昵称池 + 卡券面额
export const R_NAMES: string[] = ['马克斯','雪奈','艾米莉亚','凯哥','普里娅','汤老板','苏菲','卡洛斯','阿伊莎','芬恩','里奥','米娅','诺亚','扎拉'];
export const R_CARDS: Record<string, string[]> = {'Didi Card':['×5','×10','×3'],'JD Card':['¥100','¥200','¥50'],'Mobile Top-Up':['$10','$20','$30']};
export const R_KEYS: string[] = Object.keys(R_CARDS);

// 轮播评论（每张轮播 4 条，按语言切换）
export interface CarouselComment { n: string; zh: string; tw: string; en: string }
export const CAROUSEL_COMMENTS: CarouselComment[][] = [
  [
    { n: '老马', zh: '我觉得这次一定会通过！', tw: '我覺得這次一定會通過！', en: 'I think this will definitely pass!' },
    { n: '莎莎', zh: '现在 YES 的赔率太低了。', tw: '現在 YES 的賠率太低了。', en: 'The odds for YES are too low right now.' },
    { n: '阿凯', zh: '预计私营部门会强烈反对……', tw: '預計私營部門會強烈反對……', en: 'Strong resistance expected from the private sector...' },
    { n: '安娜', zh: 'YES 稳了。', tw: 'YES 穩了。', en: 'YES is a lock.' },
  ],
  [
    { n: '大卫', zh: '美联储看起来很鹰派。', tw: '聯準會看起來很鷹派。', en: 'The Fed looks hawkish.' },
    { n: '丽莎', zh: '油价又要涨回去了……', tw: '油價又要漲回去了……', en: 'Gas prices are going back up...' },
    { n: '汤姆', zh: '等就业报告出来再说。', tw: '等就業報告出來再說。', en: 'Wait until the jobs report comes out.' },
    { n: '艾米', zh: '通胀可能维持在 3.5% 左右。', tw: '通膨可能維持在 3.5% 左右。', en: 'Inflation might stay around 3.5%.' },
  ],
  [
    { n: '阿布', zh: '教师工会在大力推动。', tw: '教師工會在大力推動。', en: "Teachers' union is pushing hard." },
    { n: '爱丽丝', zh: '预算已经很紧张了。', tw: '預算已經很緊張了。', en: 'The budget is already too tight.' },
    { n: '阿克', zh: '涨 10% 太多了，不太可能。', tw: '漲 10% 太多了，不太可能。', en: '10% is a massive jump, unlikely.' },
    { n: '黛安', zh: '选举年，什么都可能发生。', tw: '選舉年，什麼都可能發生。', en: 'Election year, anything can happen.' },
  ],
  [
    { n: '伊森', zh: '他们刚签了长期租约。', tw: '他們剛簽了長期租約。', en: 'They just signed long term leases.' },
    { n: '菲菲', zh: '混合办公才是未来，不是全远程。', tw: '混合辦公才是未來，不是全遠端。', en: 'Hybrid is the future, not full remote.' },
    { n: '乔治', zh: '预算削减可能会逼着这么做！', tw: '預算削減可能會逼著這麼做！', en: 'Budget cuts might force it!' },
    { n: '汉娜', zh: '涉密部门不太可能。', tw: '涉密部門不太可能。', en: 'Unlikely for secure departments.' },
  ],
  [
    { n: '阿伊', zh: '大家都同意道路需要修整。', tw: '大家都同意道路需要修整。', en: 'Everyone agrees roads need fixing.' },
    { n: '朱莉', zh: '资金来源仍有争议。', tw: '資金來源仍有爭議。', en: 'Funding source is still contested.' },
    { n: '卡尔', zh: '在我看来已成定局。', tw: '在我看來已成定局。', en: 'Looks like a done deal to me.' },
    { n: '莉莉', zh: '可能小幅修订后通过。', tw: '可能小幅修訂後通過。', en: 'Might pass with minor amendments.' },
  ],
];

// 精选调研轮播 5 张幻灯片的元数据（标题/标签用 i18n key）
export interface SlideData { title: string; tags: string; pool: string; published: string; deadline: string; parts: string }
export const SLIDE_DATA: SlideData[] = [
    { title: 'fs1_title', tags: 'fs1_tags', pool: '248,000', published: '2026-05-05', deadline: '2026-09-30', parts: '2,847' },
    { title: 'fs2_title', tags: 'fs2_tags', pool: '186,500', published: '2026-06-01', deadline: '2026-12-31', parts: '1,923' },
    { title: 'fs3_title', tags: 'fs3_tags', pool: '142,800', published: '2026-05-20', deadline: '2026-11-15', parts: '1,654' },
    { title: 'fs4_title', tags: 'fs4_tags', pool: '98,200', published: '2026-04-15', deadline: '2026-10-01', parts: '1,247' },
    { title: 'fs5_title', tags: 'fs5_tags', pool: '312,600', published: '2026-04-01', deadline: '2026-08-31', parts: '3,412' },
  ];

// 顶部跑马灯中奖播报数据
export interface MqItem { name: string; pts: string; topic_zh: string; topic_zhTW: string; topic_en: string }
export const MQ_DATA: MqItem[] = [
    { name: '麦小天', pts: '+1,000', topic_zh: '公共医疗改革', topic_zhTW: '公共醫療改革', topic_en: 'Public Healthcare Reform' },
    { name: '莎拉酱', pts: '+2,500', topic_zh: '教育预算投票', topic_zhTW: '教育預算投票', topic_en: 'Education Budget Vote' },
    { name: '老詹', pts: '+800', topic_zh: '基础设施法案', topic_zhTW: '基礎設施法案', topic_en: 'Infrastructure Bill Outcome' },
    { name: '艾米粒', pts: '+3,200', topic_zh: '气候政策预测', topic_zhTW: '氣候政策預測', topic_en: 'Climate Policy Forecast' },
    { name: '大卫君', pts: '+1,500', topic_zh: '税收改革调查', topic_zhTW: '稅收改革調查', topic_en: 'Tax Reform Survey' },
    { name: '安娜酱', pts: '+950', topic_zh: '住房政策审批', topic_zhTW: '住房政策審批', topic_en: 'Housing Policy Approval' },
    { name: '罗伯特', pts: '+4,100', topic_zh: '国家预算预测', topic_zhTW: '國家預算預測', topic_en: 'National Budget Prediction' },
    { name: '丽莎不睡', pts: '+1,200', topic_zh: '数字政务倡议', topic_zhTW: '數位政務倡議', topic_en: 'Digital Gov Initiative' },
    { name: '凯文同学', pts: '+2,800', topic_zh: '公共交通改革', topic_zhTW: '公共交通改革', topic_en: 'Public Transit Reform' },
  ];

// 英文标题池（保留向后兼容引用；实际渲染按语言取 TITLES_I18N）
export const TITLES_EN: string[] = [
  'Will the new Public Health Insurance Act expand coverage to all citizens by 2027?',
  'Will national education spending increase by 15% in the next budget cycle?',
  'Will the climate change mitigation bill pass before the legislative deadline?',
  'Will digital government service adoption exceed 80% this fiscal year?',
  'Will the urban housing affordability index improve in Q3 2026?',
  'Will public satisfaction with healthcare services exceed 75% nationally?',
  'Will the national broadband infrastructure project meet its 2026 targets?',
  'Will environmental regulations be tightened by year-end 2026?',
  'Will the new cybersecurity legislation be enacted this legislative term?',
  'Will public transport ridership recover to pre-2020 levels by Q4?',
  'Will the minimum wage increase bill pass in the next parliamentary session?',
  'Will municipal water quality standards be upgraded across all major cities?',
  'Will the digital ID rollout reach 50% adoption rate by mid-year?',
  'Will emergency healthcare funding be increased by 20% in 2026?',
  'Will the open government data initiative launch on schedule?'
];

// ── 工具函数（从原站移植）──
// 生成 [a,b] 区间随机整数
export const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
// 数组随机取一项
export const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
// 千分位格式化
export const fmt = (n: number) => n.toLocaleString();
// 以 2026-06-03 为基准，按天偏移生成日期字符串
export const dateStr = (offset: number) => {
  const d = new Date("2026-06-03");
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
};

// 预测卡片数据结构
export interface PredictionCard {
  id: number; titleIdx: number; pool: number; yesPct: number; noPct: number;
  yesOdds: string; noOdds: string; parts: number; tagIndices: number[]; pub: string; dl: string;
}

// 基于 seed 的确定性整数随机（Mulberry32 PRNG，相同 seed 总是得到相同结果）
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return (a: number, b: number) => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return a + Math.floor(r * (b - a + 1));
  };
}

// 生成 N 张预测卡片（SSR/CSR 完全一致，每张卡片用自身 id 作为 seed）
export function generateCards(count = 400): PredictionCard[] {
  return Array.from({ length: count }, (_, i) => {
    const r = mulberry32(i * 0xdeadbeef + 1);
    const y = r(20, 80), n = 100 - y;
    const t0 = r(0, 9), t1 = r(0, 9);
    const tagIndices = t0 === t1 ? [t0] : [t0, t1];
    return {
      id: i, titleIdx: r(0, 14), pool: r(2000, 350000), yesPct: y, noPct: n,
      yesOdds: (100 / y).toFixed(2), noOdds: (100 / n).toFixed(2),
      parts: r(50, 6000), tagIndices, pub: dateStr(-r(1, 30)), dl: dateStr(r(10, 120)),
    };
  });
}

// 模块级固定卡片数据（用于分类页 SSR，避免 useRef 在服务端和客户端生成不同值）
export const STABLE_CARDS: PredictionCard[] = generateCards(200);

// 实时统计初始值（积分池 / 24h 量 / 预测数 / 参与者）
export const STAT_TARGETS = [2847392, 184293, 12847, 89234];

// 首页筛选标签对应的调研数量（与 TOPICS_I18N 中话题池索引顺序对应）
// 索引: 0医疗 1教育 2气候 3税收 4基础设施 5数字 6安全 7住房 8交通 9就业
export const FILTER_COUNTS: Record<string, number> = {
  all: 400,
  healthcare: 52,
  education: 47,
  climate: 39,
  tax: 34,
  infra: 45,
  digital: 38,
  safety: 41,
  housing: 29,
};

// 分类页：左侧主题标签数据结构
export interface CategoryTopic {
  key: string;
  label: string;
  count: number;
}

// 分类元数据：slug → 中文名称 + 左侧话题列表
export interface CategoryMeta {
  label: string;           // 页面/标题名称
  topics: CategoryTopic[]; // 左侧话题列表
}

// 所有分类的配置数据（slug 对应 URL 路径）
export const CATEGORY_META: Record<string, CategoryMeta> = {
  "public-services": {
    label: "公共服务",
    topics: [
      { key: "all",         label: "全部",     count: 186 },
      { key: "civil",       label: "民政",     count: 32 },
      { key: "transport",   label: "交通",     count: 21 },
      { key: "healthcare",  label: "医疗卫生", count: 28 },
      { key: "education",   label: "教育",     count: 19 },
      { key: "housing",     label: "住房",     count: 15 },
      { key: "environment", label: "环保",     count: 17 },
      { key: "safety",      label: "公共安全", count: 24 },
      { key: "digital",     label: "数字政务", count: 18 },
      { key: "social",      label: "社会保障", count: 12 },
    ],
  },
  "policy-research": {
    label: "政策研究",
    topics: [
      { key: "all",         label: "全部",     count: 143 },
      { key: "fiscal",      label: "财政政策", count: 28 },
      { key: "monetary",    label: "货币政策", count: 19 },
      { key: "industrial",  label: "产业政策", count: 22 },
      { key: "trade",       label: "贸易政策", count: 17 },
      { key: "land",        label: "土地政策", count: 14 },
      { key: "labor",       label: "劳动政策", count: 16 },
      { key: "environment", label: "环保政策", count: 13 },
      { key: "tech",        label: "科技政策", count: 14 },
    ],
  },
  "satisfaction-survey": {
    label: "满意度调查",
    topics: [
      { key: "all",         label: "全部",     count: 98 },
      { key: "gov",         label: "政府服务", count: 24 },
      { key: "medical",     label: "医疗满意度", count: 18 },
      { key: "education",   label: "教育满意度", count: 15 },
      { key: "transit",     label: "公共交通", count: 12 },
      { key: "housing",     label: "住房服务", count: 11 },
      { key: "environment", label: "环境质量", count: 10 },
      { key: "justice",     label: "司法满意度", count: 8 },
    ],
  },
  "education": {
    label: "教育",
    topics: [
      { key: "all",         label: "全部",     count: 117 },
      { key: "k12",         label: "基础教育", count: 26 },
      { key: "higher",      label: "高等教育", count: 22 },
      { key: "vocational",  label: "职业教育", count: 18 },
      { key: "preschool",   label: "学前教育", count: 14 },
      { key: "special",     label: "特殊教育", count: 9 },
      { key: "online",      label: "在线教育", count: 16 },
      { key: "budget",      label: "教育经费", count: 12 },
    ],
  },
  "health-medical": {
    label: "健康医疗",
    topics: [
      { key: "all",         label: "全部",     count: 134 },
      { key: "insurance",   label: "医疗保险", count: 27 },
      { key: "hospital",    label: "医院服务", count: 21 },
      { key: "pharma",      label: "药品政策", count: 18 },
      { key: "mental",      label: "心理健康", count: 16 },
      { key: "elderly",     label: "老年医疗", count: 20 },
      { key: "public",      label: "公共卫生", count: 19 },
      { key: "rural",       label: "农村医疗", count: 13 },
    ],
  },
  "business-survey": {
    label: "商业调查",
    topics: [
      { key: "all",         label: "全部",     count: 109 },
      { key: "consumer",    label: "消费行为", count: 24 },
      { key: "enterprise",  label: "企业经营", count: 20 },
      { key: "market",      label: "市场趋势", count: 18 },
      { key: "finance",     label: "金融市场", count: 16 },
      { key: "tech",        label: "科技产业", count: 14 },
      { key: "realestate",  label: "房地产",   count: 11 },
      { key: "startup",     label: "创业创新", count: 6 },
    ],
  },
  "personal-enterprise": {
    label: "个人/企业",
    topics: [
      { key: "all",         label: "全部",     count: 88 },
      { key: "income",      label: "个人收入", count: 19 },
      { key: "career",      label: "职业发展", count: 16 },
      { key: "welfare",     label: "福利保障", count: 14 },
      { key: "sme",         label: "中小企业", count: 15 },
      { key: "tax",         label: "税务合规", count: 12 },
      { key: "employment",  label: "就业状况", count: 12 },
    ],
  },
};

// 向后兼容：公共服务专用导出
export const PUBLIC_SERVICE_TOPICS: CategoryTopic[] = CATEGORY_META["public-services"].topics;

// 排序选项
export type SortKey = "volume24h" | "totalPool" | "latest";
export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "volume24h", label: "24小时积分量" },
  { key: "totalPool", label: "总积分量" },
  { key: "latest",    label: "最新发布" },
];

// 时间范围选项
export type PeriodKey = "day" | "week" | "month" | "quarter" | "all";
export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "day",     label: "每天" },
  { key: "week",    label: "每周" },
  { key: "month",   label: "每月" },
  { key: "quarter", label: "每季" },
  { key: "all",     label: "全部" },
];

// 状态选项
export type StatusKey = "active" | "settled" | "all";
export const STATUS_OPTIONS: { key: StatusKey; label: string }[] = [
  { key: "active",   label: "进行中" },
  { key: "settled",  label: "已结算" },
  { key: "all",      label: "全部" },
];
