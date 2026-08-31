"""Seed data for Allv2Store catalog (mirrors frontend mock.js). Used to populate MongoDB on first run."""

GRAD = {
    'ml': 'linear-gradient(145deg,#0ea5e9,#1e3a8a)',
    'pubg': 'linear-gradient(145deg,#f59e0b,#7c2d12)',
    'ff': 'linear-gradient(145deg,#ef4444,#7f1d1d)',
    'hok': 'linear-gradient(145deg,#eab308,#713f12)',
    'genshin': 'linear-gradient(145deg,#22d3ee,#0e7490)',
    'valo': 'linear-gradient(145deg,#fb7185,#881337)',
    'cod': 'linear-gradient(145deg,#64748b,#0f172a)',
    'hsr': 'linear-gradient(145deg,#a78bfa,#4c1d95)',
    'aov': 'linear-gradient(145deg,#f472b6,#831843)',
    'roblox': 'linear-gradient(145deg,#94a3b8,#334155)',
    'ragnarok': 'linear-gradient(145deg,#34d399,#065f46)',
    'pb': 'linear-gradient(145deg,#f97316,#7c2d12)',
    'zepeto': 'linear-gradient(145deg,#f9a8d4,#9d174d)',
    'coc': 'linear-gradient(145deg,#facc15,#854d0e)',
}


def _denoms(slug, unit, rows):
    out = []
    for i, r in enumerate(rows):
        out.append({
            'id': f"{slug}-{i+1}",
            'name': f"{r['amt']} {unit}",
            'amount': r['amt'],
            'price': r['price'],
            'oldPrice': r.get('old'),
            'bonus': r.get('bonus'),
            'tag': r.get('tag'),
        })
    return out


GAMES = [
    {'slug': 'mobile-legends', 'name': 'Mobile Legends', 'publisher': 'Moonton', 'category': 'MOBA', 'unit': 'Diamonds', 'grad': GRAD['ml'], 'badge': 'ML', 'priceFrom': 2000, 'popular': True, 'active': True,
     'fields': [{'key': 'userId', 'label': 'User ID', 'placeholder': '12345678'}, {'key': 'zoneId', 'label': 'Zone ID', 'placeholder': '1234'}],
     'denoms': _denoms('mobile-legends', 'Diamonds', [{'amt':5,'price':2000},{'amt':12,'price':3900},{'amt':28,'price':8500},{'amt':44,'price':13000,'tag':'Populer'},{'amt':86,'price':24000},{'amt':172,'price':47000},{'amt':257,'price':70000},{'amt':344,'price':92000},{'amt':514,'price':138000},{'amt':706,'price':188000}])},
    {'slug': 'pubg-mobile', 'name': 'PUBG Mobile', 'publisher': 'Tencent', 'category': 'Battle Royale', 'unit': 'UC', 'grad': GRAD['pubg'], 'badge': 'PUBG', 'priceFrom': 15000, 'popular': True, 'active': True,
     'fields': [{'key': 'userId', 'label': 'User ID', 'placeholder': '5123456789'}],
     'denoms': _denoms('pubg-mobile', 'UC', [{'amt':60,'price':15000},{'amt':325,'price':75000,'old':83500,'tag':'Hemat'},{'amt':660,'price':150000},{'amt':1800,'price':380000},{'amt':3850,'price':780000},{'amt':8100,'price':1520000,'old':1600000}])},
    {'slug': 'free-fire', 'name': 'Free Fire', 'publisher': 'Garena', 'category': 'Battle Royale', 'unit': 'Diamonds', 'grad': GRAD['ff'], 'badge': 'FF', 'priceFrom': 2000, 'popular': True, 'active': True,
     'fields': [{'key': 'userId', 'label': 'ID Player', 'placeholder': '123456789'}],
     'denoms': _denoms('free-fire', 'Diamonds', [{'amt':5,'price':2000},{'amt':12,'price':3500},{'amt':50,'price':11000,'tag':'Populer'},{'amt':70,'price':15000},{'amt':140,'price':29000},{'amt':355,'price':72000},{'amt':720,'price':145000}])},
    {'slug': 'honor-of-kings', 'name': 'Honor of Kings', 'publisher': 'TiMi Studio', 'category': 'MOBA', 'unit': 'Tokens', 'grad': GRAD['hok'], 'badge': 'HOK', 'priceFrom': 5000, 'popular': False, 'active': True,
     'fields': [{'key': 'userId', 'label': 'User ID', 'placeholder': 'HOK123456'}],
     'denoms': _denoms('honor-of-kings', 'Tokens', [{'amt':16,'price':5000},{'amt':80,'price':24000,'old':30000,'tag':'-20%'},{'amt':240,'price':70000},{'amt':560,'price':160000},{'amt':1200,'price':340000},{'amt':2400,'price':690000,'bonus':'Bonus 20%'}])},
    {'slug': 'genshin-impact', 'name': 'Genshin Impact', 'publisher': 'HoYoverse', 'category': 'RPG', 'unit': 'Crystals', 'grad': GRAD['genshin'], 'badge': 'GI', 'priceFrom': 16000, 'popular': True, 'active': True,
     'fields': [{'key': 'userId', 'label': 'UID', 'placeholder': '8xxxxxxxx'}, {'key': 'server', 'label': 'Server', 'type': 'select', 'options': ['Asia', 'America', 'Europe', 'TW/HK/MO']}],
     'denoms': _denoms('genshin-impact', 'Crystals', [{'amt':60,'price':16000},{'amt':300,'price':79000,'tag':'Populer'},{'amt':980,'price':239000},{'amt':1980,'price':479000},{'amt':3280,'price':799000},{'amt':6480,'price':1549000}])},
    {'slug': 'valorant', 'name': 'Valorant', 'publisher': 'Riot Games', 'category': 'FPS', 'unit': 'Points', 'grad': GRAD['valo'], 'badge': 'VAL', 'priceFrom': 15000, 'popular': True, 'active': True,
     'fields': [{'key': 'riotId', 'label': 'Riot ID', 'placeholder': 'Nama#TAG'}],
     'denoms': _denoms('valorant', 'Points', [{'amt':125,'price':15000},{'amt':420,'price':49000},{'amt':700,'price':79000,'tag':'Populer'},{'amt':1375,'price':149000},{'amt':2400,'price':259000},{'amt':4000,'price':429000}])},
    {'slug': 'cod-mobile', 'name': 'Call of Duty Mobile', 'publisher': 'Activision', 'category': 'FPS', 'unit': 'CP', 'grad': GRAD['cod'], 'badge': 'CODM', 'priceFrom': 12000, 'popular': False, 'active': True,
     'fields': [{'key': 'openId', 'label': 'Open ID', 'placeholder': 'Open ID akun'}],
     'denoms': _denoms('cod-mobile', 'CP', [{'amt':80,'price':12000},{'amt':400,'price':55000},{'amt':800,'price':105000,'tag':'Populer'},{'amt':2000,'price':250000},{'amt':5000,'price':590000}])},
    {'slug': 'honkai-star-rail', 'name': 'Honkai Star Rail', 'publisher': 'HoYoverse', 'category': 'RPG', 'unit': 'Shard', 'grad': GRAD['hsr'], 'badge': 'HSR', 'priceFrom': 16000, 'popular': False, 'active': True,
     'fields': [{'key': 'userId', 'label': 'UID', 'placeholder': '7xxxxxxxx'}, {'key': 'server', 'label': 'Server', 'type': 'select', 'options': ['Asia', 'America', 'Europe', 'TW/HK/MO']}],
     'denoms': _denoms('honkai-star-rail', 'Shard', [{'amt':60,'price':16000},{'amt':300,'price':79000},{'amt':980,'price':239000,'tag':'Populer'},{'amt':1980,'price':479000},{'amt':3280,'price':799000}])},
    {'slug': 'arena-of-valor', 'name': 'Arena of Valor', 'publisher': 'Garena', 'category': 'MOBA', 'unit': 'Vouchers', 'grad': GRAD['aov'], 'badge': 'AOV', 'priceFrom': 5000, 'popular': False, 'active': True,
     'fields': [{'key': 'userId', 'label': 'User ID', 'placeholder': 'AOV123456'}],
     'denoms': _denoms('arena-of-valor', 'Vouchers', [{'amt':20,'price':5000},{'amt':60,'price':15000},{'amt':220,'price':50000,'tag':'Populer'},{'amt':560,'price':125000},{'amt':1160,'price':250000}])},
    {'slug': 'roblox', 'name': 'Roblox', 'publisher': 'Roblox Corp', 'category': 'Sandbox', 'unit': 'Robux', 'grad': GRAD['roblox'], 'badge': 'RBX', 'priceFrom': 15000, 'popular': False, 'active': True,
     'fields': [{'key': 'username', 'label': 'Username', 'placeholder': 'Username Roblox'}],
     'denoms': _denoms('roblox', 'Robux', [{'amt':80,'price':15000},{'amt':400,'price':70000,'old':75500,'tag':'-7%'},{'amt':800,'price':135000},{'amt':1700,'price':279000},{'amt':4500,'price':720000},{'amt':10000,'price':1550000,'bonus':'Hemat 10%'}])},
    {'slug': 'ragnarok-m', 'name': 'Ragnarok M', 'publisher': 'Gravity', 'category': 'MMORPG', 'unit': 'BCC', 'grad': GRAD['ragnarok'], 'badge': 'ROM', 'priceFrom': 15000, 'popular': False, 'active': True,
     'fields': [{'key': 'userId', 'label': 'Character ID', 'placeholder': 'ID karakter'}],
     'denoms': _denoms('ragnarok-m', 'BCC', [{'amt':40,'price':15000},{'amt':120,'price':42000},{'amt':300,'price':100000,'tag':'Populer'},{'amt':620,'price':200000}])},
    {'slug': 'point-blank', 'name': 'Point Blank', 'publisher': 'Zepetto', 'category': 'FPS', 'unit': 'PB Cash', 'grad': GRAD['pb'], 'badge': 'PB', 'priceFrom': 10000, 'popular': False, 'active': True,
     'fields': [{'key': 'userId', 'label': 'ID / Email', 'placeholder': 'ID akun PB'}],
     'denoms': _denoms('point-blank', 'PB Cash', [{'amt':1000,'price':10000},{'amt':3000,'price':28000},{'amt':6000,'price':55000,'tag':'Populer'},{'amt':12000,'price':105000}])},
    {'slug': 'zepeto', 'name': 'Zepeto', 'publisher': 'Naver Z', 'category': 'Metaverse', 'unit': 'Zem', 'grad': GRAD['zepeto'], 'badge': 'ZEP', 'priceFrom': 12000, 'popular': False, 'active': True,
     'fields': [{'key': 'userId', 'label': 'Zepeto Code', 'placeholder': 'Kode Zepeto'}],
     'denoms': _denoms('zepeto', 'Zem', [{'amt':29,'price':12000},{'amt':84,'price':32000},{'amt':170,'price':62000,'tag':'Populer'},{'amt':430,'price':150000}])},
    {'slug': 'clash-of-clans', 'name': 'Clash of Clans', 'publisher': 'Supercell', 'category': 'Strategy', 'unit': 'Gems', 'grad': GRAD['coc'], 'badge': 'COC', 'priceFrom': 15000, 'popular': False, 'active': True,
     'fields': [{'key': 'tag', 'label': 'Player Tag', 'placeholder': '#XXXXXX'}],
     'denoms': _denoms('clash-of-clans', 'Gems', [{'amt':80,'price':15000},{'amt':500,'price':79000},{'amt':1200,'price':179000,'tag':'Populer'},{'amt':2500,'price':350000}])},
]

VOUCHERS = [
    {'code': 'QRISHEMAT', 'desc': 'Potongan Rp 10.000', 'min': 'Min. belanja Rp 100.000', 'type': 'fixed', 'value': 10000, 'minSpend': 100000, 'active': True},
    {'code': 'NEWBIE', 'desc': 'Potongan Rp 5.000 pengguna baru', 'min': 'Min. belanja Rp 15.000', 'type': 'fixed', 'value': 5000, 'minSpend': 15000, 'active': True},
    {'code': 'BOLT10', 'desc': 'Diskon 10% (maks. Rp 25.000)', 'min': 'Min. belanja Rp 20.000', 'type': 'percent', 'value': 10, 'maxCut': 25000, 'minSpend': 20000, 'active': True},
    {'code': 'AGUST', 'desc': 'Khusus Mobile Legends', 'min': 'Min. belanja Rp 0', 'type': 'fixed', 'value': 3000, 'minSpend': 0, 'active': True},
    {'code': 'DFAS', 'desc': 'Khusus Mobile Legends', 'min': 'Min. belanja Rp 0', 'type': 'fixed', 'value': 2000, 'minSpend': 0, 'active': True},
    {'code': 'CYBER15', 'desc': 'Diskon 15% semua game (maks. Rp 30.000)', 'min': 'Min. belanja Rp 50.000', 'type': 'percent', 'value': 15, 'maxCut': 30000, 'minSpend': 50000, 'active': True},
]

BANNERS = [
    {'id': 'b1', 'tag': 'PENAWARAN TERBATAS', 'title': 'BONUS 20% TOKEN', 'subtitle': 'Setiap top up Honor of Kings', 'game': 'honor-of-kings', 'active': True, 'order': 1,
     'image': 'https://images.unsplash.com/photo-1672872476232-da16b45c9001?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwyfHxjeWJlcnB1bmslMjBuZW9ufGVufDB8fHx8MTc4ODE2NzUxMnww&ixlib=rb-4.1.0&q=85'},
    {'id': 'b2', 'tag': 'PROMO SPESIAL', 'title': 'HEMAT 5% QRIS', 'subtitle': 'Top Up 8100 UC PUBG Mobile via QRIS', 'game': 'pubg-mobile', 'active': True, 'order': 2,
     'image': 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxjeWJlcnB1bmslMjBuZW9ufGVufDB8fHx8MTc4ODE2NzUxMnww&ixlib=rb-4.1.0&q=85'},
    {'id': 'b3', 'tag': 'NEW SEASON', 'title': 'DIAMOND MURAH', 'subtitle': 'Mobile Legends mulai Rp 2.000 - proses instan', 'game': 'mobile-legends', 'active': True, 'order': 3,
     'image': 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxuZW9uJTIwY2l0eXxlbnwwfHx8fDE3ODgxNjc1MTJ8MA&ixlib=rb-4.1.0&q=85'},
]

FLASHSALE = [
    {'id': 'fs1', 'gameSlug': 'roblox', 'denomId': 'roblox-2', 'discount': 7, 'active': True},
    {'id': 'fs2', 'gameSlug': 'pubg-mobile', 'denomId': 'pubg-mobile-6', 'discount': 5, 'active': True},
    {'id': 'fs3', 'gameSlug': 'honor-of-kings', 'denomId': 'honor-of-kings-2', 'discount': 20, 'active': True},
    {'id': 'fs4', 'gameSlug': 'pubg-mobile', 'denomId': 'pubg-mobile-2', 'discount': 10, 'active': True},
]

SPECIALOFFERS = [
    {'id': 'so1', 'gameSlug': 'honor-of-kings', 'denomId': 'honor-of-kings-6', 'active': True},
    {'id': 'so2', 'gameSlug': 'roblox', 'denomId': 'roblox-6', 'active': True},
    {'id': 'so3', 'gameSlug': 'genshin-impact', 'denomId': 'genshin-impact-6', 'active': True},
]

PAYMENTS = [
    {'id': 'qris', 'name': 'QRIS', 'group': 'E-Wallet & QRIS', 'fee': 0, 'badge': 'QRIS', 'active': True, 'order': 1},
    {'id': 'dana', 'name': 'DANA', 'group': 'E-Wallet & QRIS', 'fee': 0, 'badge': 'DANA', 'active': True, 'order': 2},
    {'id': 'gopay', 'name': 'GoPay', 'group': 'E-Wallet & QRIS', 'fee': 0, 'badge': 'GO', 'active': True, 'order': 3},
    {'id': 'ovo', 'name': 'OVO', 'group': 'E-Wallet & QRIS', 'fee': 0, 'badge': 'OVO', 'active': True, 'order': 4},
    {'id': 'shopeepay', 'name': 'ShopeePay', 'group': 'E-Wallet & QRIS', 'fee': 0, 'badge': 'SP', 'active': True, 'order': 5},
    {'id': 'bca', 'name': 'BCA Virtual Account', 'group': 'Transfer Bank (Virtual Account)', 'fee': 4000, 'badge': 'BCA', 'active': True, 'order': 6},
    {'id': 'mandiri', 'name': 'Mandiri Virtual Account', 'group': 'Transfer Bank (Virtual Account)', 'fee': 4000, 'badge': 'MDR', 'active': True, 'order': 7},
    {'id': 'bni', 'name': 'BNI Virtual Account', 'group': 'Transfer Bank (Virtual Account)', 'fee': 4000, 'badge': 'BNI', 'active': True, 'order': 8},
    {'id': 'bri', 'name': 'BRI Virtual Account', 'group': 'Transfer Bank (Virtual Account)', 'fee': 4000, 'badge': 'BRI', 'active': True, 'order': 9},
    {'id': 'alfamart', 'name': 'Alfamart', 'group': 'Retail', 'fee': 2500, 'badge': 'ALFA', 'active': True, 'order': 10},
    {'id': 'indomaret', 'name': 'Indomaret', 'group': 'Retail', 'fee': 2500, 'badge': 'INDO', 'active': True, 'order': 11},
]

SETTINGS = {
    'id': 'site',
    'siteName': 'Allv2Store',
    'tagline': 'Top Up Game Termurah & Instan',
    'whatsapp': '6281234567890',
    'primaryColor': '#00e5ff',
    'accentColor': '#ff2fb0',
    'flashSaleHours': 15,
    'announcement': '',
    # Branding / media (dikelola dari panel admin)
    'logoUrl': '',
    'logoWidth': 36,
    'faviconUrl': '',
    'footerAbout': 'Top up game termurah & instan. Mobile Legends, PUBG, Free Fire, Genshin, Valorant, dan puluhan game lainnya.',
    'socialInstagram': '',
    'socialTelegram': '',
    'socialFacebook': '',
    'supportHours': 'Support 24 jam setiap hari',
    'footerNote': '© 2025 Allv2Store. Semua transaksi diproses secara aman. Bukan afiliasi resmi dari game manapun.',
    # Operasional
    'allowManualPay': True,
    'markupType': 'percent',
    'markupValue': 10,
    'roundTo': 500,
}

SELLACCOUNTS = [
    {'id': 'sa1', 'game': 'Mobile Legends', 'title': 'Akun Mythic Glory 120 Skin', 'rank': 'Mythic Glory', 'skins': 120, 'price': 1250000, 'grad': GRAD['ml'], 'badge': 'ML', 'active': True},
    {'id': 'sa2', 'game': 'Genshin Impact', 'title': 'AR58 5 Karakter Bintang 5', 'rank': 'AR 58', 'skins': 5, 'price': 2100000, 'grad': GRAD['genshin'], 'badge': 'GI', 'active': True},
    {'id': 'sa3', 'game': 'Free Fire', 'title': 'Akun Grandmaster Bundle Rare', 'rank': 'Grandmaster', 'skins': 45, 'price': 780000, 'grad': GRAD['ff'], 'badge': 'FF', 'active': True},
    {'id': 'sa4', 'game': 'Valorant', 'title': 'Immortal 3 Vandal Prime', 'rank': 'Immortal 3', 'skins': 18, 'price': 1650000, 'grad': GRAD['valo'], 'badge': 'VAL', 'active': True},
    {'id': 'sa5', 'game': 'PUBG Mobile', 'title': 'Conqueror Set Mythic', 'rank': 'Conqueror', 'skins': 60, 'price': 1900000, 'grad': GRAD['pubg'], 'badge': 'PUBG', 'active': True},
    {'id': 'sa6', 'game': 'Honkai Star Rail', 'title': 'TL65 Lightcone Lengkap', 'rank': 'TL 65', 'skins': 8, 'price': 1450000, 'grad': GRAD['hsr'], 'badge': 'HSR', 'active': True},
]

ITEMSKINS = [
    {'id': 'is1', 'game': 'Mobile Legends', 'title': 'Skin Legend Gusion Cosmic', 'price': 285000, 'grad': GRAD['ml'], 'badge': 'ML', 'active': True},
    {'id': 'is2', 'game': 'Free Fire', 'title': 'Bundle Alok Elite Pass', 'price': 95000, 'grad': GRAD['ff'], 'badge': 'FF', 'active': True},
    {'id': 'is3', 'game': 'Valorant', 'title': 'Reaver Vandal Bundle', 'price': 320000, 'grad': GRAD['valo'], 'badge': 'VAL', 'active': True},
    {'id': 'is4', 'game': 'PUBG Mobile', 'title': 'Glacier M416 Skin', 'price': 410000, 'grad': GRAD['pubg'], 'badge': 'PUBG', 'active': True},
    {'id': 'is5', 'game': 'Genshin Impact', 'title': 'Welkin Moon 30 Hari', 'price': 79000, 'grad': GRAD['genshin'], 'badge': 'GI', 'active': True},
    {'id': 'is6', 'game': 'Mobile Legends', 'title': 'Starlight Member Bulanan', 'price': 149000, 'grad': GRAD['ml'], 'badge': 'ML', 'active': True},
]

PULSAOPERATORS = [
    {'id': 'telkomsel', 'name': 'Telkomsel', 'badge': 'TSEL', 'active': True},
    {'id': 'indosat', 'name': 'Indosat', 'badge': 'ISAT', 'active': True},
    {'id': 'xl', 'name': 'XL Axiata', 'badge': 'XL', 'active': True},
    {'id': 'tri', 'name': 'Tri', 'badge': '3', 'active': True},
    {'id': 'smartfren', 'name': 'Smartfren', 'badge': 'SMART', 'active': True},
    {'id': 'axis', 'name': 'Axis', 'badge': 'AXIS', 'active': True},
]

PULSANOMINALS = [
    {'id': 'pn1', 'amt': 5000, 'price': 6500, 'active': True},
    {'id': 'pn2', 'amt': 10000, 'price': 11500, 'active': True},
    {'id': 'pn3', 'amt': 15000, 'price': 16500, 'active': True},
    {'id': 'pn4', 'amt': 20000, 'price': 21000, 'active': True},
    {'id': 'pn5', 'amt': 25000, 'price': 26000, 'active': True},
    {'id': 'pn6', 'amt': 50000, 'price': 50500, 'active': True},
    {'id': 'pn7', 'amt': 100000, 'price': 99500, 'active': True},
    {'id': 'pn8', 'amt': 150000, 'price': 148000, 'active': True},
]

TAGIHAN = [
    {'id': 'pln', 'name': 'Token PLN', 'badge': 'PLN', 'active': True},
    {'id': 'pdam', 'name': 'PDAM', 'badge': 'PDAM', 'active': True},
    {'id': 'bpjs', 'name': 'BPJS Kesehatan', 'badge': 'BPJS', 'active': True},
    {'id': 'internet', 'name': 'Internet & TV', 'badge': 'NET', 'active': True},
]
