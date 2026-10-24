import type { ProvinceInfo } from './cities';

// 韩国出生地经度（市厅 / 郡厅所在地，度，东经），供韩国路径真太阳时校正。
// 精度 0.01°（≈ 2.4 秒时差），足够判断两小时一档的时辰边界。
// 每个道的首条为道厅所在城市；特别市 / 广域市只列市本身（市内经度跨度 < 0.5°，≈ 2 分钟）。
export const KR_PROVINCES: ProvinceInfo[] = [
  { name: '서울특별시', cities: [{ name: '서울', longitude: 126.98 }] },
  { name: '부산광역시', cities: [{ name: '부산', longitude: 129.08 }] },
  { name: '대구광역시', cities: [{ name: '대구', longitude: 128.60 }] },
  { name: '인천광역시', cities: [{ name: '인천', longitude: 126.71 }] },
  { name: '광주광역시', cities: [{ name: '광주', longitude: 126.85 }] },
  { name: '대전광역시', cities: [{ name: '대전', longitude: 127.38 }] },
  { name: '울산광역시', cities: [{ name: '울산', longitude: 129.31 }] },
  { name: '세종특별자치시', cities: [{ name: '세종', longitude: 127.29 }] },
  {
    name: '경기도',
    cities: [
      { name: '수원', longitude: 127.03 }, { name: '성남', longitude: 127.13 },
      { name: '고양', longitude: 126.83 }, { name: '용인', longitude: 127.18 },
      { name: '부천', longitude: 126.77 }, { name: '안산', longitude: 126.83 },
      { name: '안양', longitude: 126.95 }, { name: '남양주', longitude: 127.22 },
      { name: '화성', longitude: 126.83 }, { name: '평택', longitude: 127.11 },
      { name: '의정부', longitude: 127.03 }, { name: '파주', longitude: 126.78 },
      { name: '김포', longitude: 126.72 }, { name: '광명', longitude: 126.86 },
      { name: '이천', longitude: 127.44 }, { name: '포천', longitude: 127.20 },
      { name: '양평', longitude: 127.49 }, { name: '가평', longitude: 127.51 },
    ],
  },
  {
    name: '강원특별자치도',
    cities: [
      { name: '춘천', longitude: 127.73 }, { name: '원주', longitude: 127.92 },
      { name: '강릉', longitude: 128.88 }, { name: '속초', longitude: 128.59 },
      { name: '동해', longitude: 129.11 }, { name: '삼척', longitude: 129.17 },
      { name: '태백', longitude: 128.99 },
    ],
  },
  {
    name: '충청북도',
    cities: [
      { name: '청주', longitude: 127.49 }, { name: '충주', longitude: 127.93 },
      { name: '제천', longitude: 128.19 },
    ],
  },
  {
    name: '충청남도',
    cities: [
      { name: '홍성', longitude: 126.66 }, { name: '천안', longitude: 127.11 },
      { name: '아산', longitude: 127.00 }, { name: '공주', longitude: 127.12 },
      { name: '보령', longitude: 126.61 }, { name: '서산', longitude: 126.45 },
      { name: '논산', longitude: 127.10 }, { name: '당진', longitude: 126.65 },
    ],
  },
  {
    name: '전북특별자치도',
    cities: [
      { name: '전주', longitude: 127.15 }, { name: '군산', longitude: 126.74 },
      { name: '익산', longitude: 126.96 }, { name: '정읍', longitude: 126.86 },
      { name: '남원', longitude: 127.39 }, { name: '김제', longitude: 126.88 },
    ],
  },
  {
    name: '전라남도',
    cities: [
      { name: '무안', longitude: 126.48 }, { name: '목포', longitude: 126.39 },
      { name: '여수', longitude: 127.66 }, { name: '순천', longitude: 127.49 },
      { name: '나주', longitude: 126.71 }, { name: '광양', longitude: 127.70 },
    ],
  },
  {
    name: '경상북도',
    cities: [
      { name: '안동', longitude: 128.73 }, { name: '포항', longitude: 129.34 },
      { name: '경주', longitude: 129.22 }, { name: '김천', longitude: 128.11 },
      { name: '구미', longitude: 128.34 }, { name: '영주', longitude: 128.62 },
      { name: '영천', longitude: 128.94 }, { name: '상주', longitude: 128.16 },
      { name: '문경', longitude: 128.19 }, { name: '경산', longitude: 128.74 },
    ],
  },
  {
    name: '경상남도',
    cities: [
      { name: '창원', longitude: 128.68 }, { name: '진주', longitude: 128.11 },
      { name: '통영', longitude: 128.43 }, { name: '사천', longitude: 128.06 },
      { name: '김해', longitude: 128.89 }, { name: '밀양', longitude: 128.75 },
      { name: '거제', longitude: 128.62 }, { name: '양산', longitude: 129.04 },
    ],
  },
  {
    name: '제주특별자치도',
    cities: [
      { name: '제주', longitude: 126.53 }, { name: '서귀포', longitude: 126.56 },
    ],
  },
];
