# Kho san pham tap hoa

Web tinh de tra cuu gia va so luong ton kho cho mot quan tap hoa nho. Du lieu
duoc luu trong Google Sheets, trang web doc du lieu tu link CSV public.

## Cau truc Google Sheets

Tao mot Google Sheet voi hang dau tien la tieu de cot:

| ma | ten | nhom | gia | ton | ghi chu |
| --- | --- | --- | --- | --- | --- |
| SP001 | Mi Hao Hao tom chua cay | Do an | 4500 | 120 | Thung 30 goi |
| SP002 | Sua tuoi Vinamilk 180ml | Do uong | 8000 | 24 |  |

Y nghia cac cot:

- `ma`: ma san pham hoac SKU.
- `ten`: ten san pham.
- `nhom`: nhom hang de loc nhanh.
- `gia`: gia ban, chi nen nhap so.
- `ton`: so luong ton kho.
- `ghi chu`: thong tin them neu can.

## Lay link CSV tu Google Sheets

1. Mo Google Sheet.
2. Chon `File` -> `Share` -> `Publish to web`.
3. Chon sheet dang dung.
4. Chon dinh dang `Comma-separated values (.csv)`.
5. Bam `Publish`.
6. Copy link CSV duoc Google tao.
7. Mo file `script.js` va thay:

```js
const SHEET_CSV_URL = "";
```

bang:

```js
const SHEET_CSV_URL = "LINK_CSV_CUA_BAN";
```

## Chay tren may

Mo truc tiep file `index.html` trong trinh duyet.

Neu trinh duyet chan viec doc file cuc bo, co the chay server nho:

```bash
python3 -m http.server 8000
```

Sau do mo `http://localhost:8000`.

## Deploy len GitHub Pages

1. Day code len GitHub.
2. Vao repository `Settings` -> `Pages`.
3. Chon source la branch dang dung, thuong la `main`.
4. Chon folder `/root`.
5. Luu lai va doi GitHub tao link web.

## Cap nhat san pham

Nguoi ban sua san pham truc tiep trong Google Sheets. Trang web se doc du lieu
moi khi tai lai trang hoac bam nut `Tai lai du lieu`.
