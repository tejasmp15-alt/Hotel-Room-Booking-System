const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

const ROOT_DIR = path.resolve(__dirname, '../..');
const DEFAULT_DB_PATH = path.join(ROOT_DIR, 'database', 'hotel_booking.db');
const DB_PATH = process.env.DB_PATH
  ? path.resolve(ROOT_DIR, process.env.DB_PATH)
  : DEFAULT_DB_PATH;

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

const SCHEMA_PATH = path.join(ROOT_DIR, 'database', 'schema.sql');

function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysISO(days, baseDateStr = getTodayISO()) {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function calculateNights(checkIn, checkOut) {
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / 86400000);
}

function initializeDatabase({ reset = false } = {}) {
  if (reset) {
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec(`
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS contact_messages;
      DROP TABLE IF EXISTS bookings;
      DROP TABLE IF EXISTS rooms;
      DROP TABLE IF EXISTS admins;
      DROP TABLE IF EXISTS users;
    `);
    db.exec('PRAGMA foreign_keys = ON;');
  }

  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schemaSql);

  const adminCount = db.prepare('SELECT COUNT(*) AS count FROM admins').get().count;
  if (adminCount === 0) {
    const insertAdmin = db.prepare(`
      INSERT INTO admins (username, full_name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertAdmin.run('admin', 'Tejas M P', 'admin@azurestay.com', bcrypt.hashSync('Admin@123', 10), 'superadmin');
    insertAdmin.run('manager', 'Ashok N M', 'ashok@azurestay.com', bcrypt.hashSync('Manager@123', 10), 'manager');
  }

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (full_name, email, phone, password_hash)
      VALUES (?, ?, ?, ?)
    `);
    insertUser.run('John Doe', 'john.doe@example.com', '+91 9876543210', bcrypt.hashSync('User@123', 10));
    insertUser.run('Priya Sharma', 'priya.sharma@example.com', '+91 9876501234', bcrypt.hashSync('User@123', 10));
  }

  const roomCount = db.prepare('SELECT COUNT(*) AS count FROM rooms').get().count;
  if (roomCount === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO rooms (
        room_number, name, room_type, description, price_per_night,
        max_guests, bed_type, size_sqft, amenities, image_url,
        availability_status, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedRooms = [
      [
        '101',
        'Cozy Harbor Single',
        'Single',
        'A peaceful minimalist retreat designed for solo travelers featuring harbor views, ergonomic workspace, high-speed Wi-Fi, and crisp cotton linens.',
        85,
        1,
        'Single Plush Bed',
        240,
        'Free Wi-Fi, Smart TV, Work Desk, Air Conditioning, Rain Shower, Coffee Maker',
        '/assets/images/room-single-1.jpg',
        'available',
        1
      ],
      [
        '102',
        'Classic City Single',
        'Single',
        'Quiet modern single room overlooking the downtown promenade with ambient lighting, blackout drapes, and complimentary morning coffee service.',
        95,
        1,
        'Single Orthopedic Bed',
        260,
        'Free Wi-Fi, Smart TV, Work Desk, Air Conditioning, In-Room Safe, Mini Fridge',
        '/assets/images/room-single-2.jpg',
        'available',
        0
      ],
      [
        '201',
        'Azure Breeze Double',
        'Double',
        'Bright coastal-inspired double room with sunlit balcony doors, plush queen bed, royal blue accent cushions, and serene ocean air.',
        135,
        2,
        'Queen Bed',
        340,
        'Free Wi-Fi, Private Balcony, Smart TV, Air Conditioning, Mini Bar, Breakfast Included',
        '/assets/images/room-double-1.jpg',
        'available',
        1
      ],
      [
        '202',
        'Garden View Double',
        'Double',
        'Tranquil twin-bedded double accommodation looking onto lush courtyard gardens, tailored for friends or colleagues traveling together.',
        145,
        2,
        'Two Twin Beds',
        360,
        'Free Wi-Fi, Garden View, Smart TV, Tea Station, Air Conditioning, Seating Nook',
        '/assets/images/room-double-2.jpg',
        'available',
        0
      ],
      [
        '301',
        'Oceanfront Deluxe King',
        'Deluxe',
        'Expansive oceanfront sanctuary boasting panoramic coastal windows, velvet lounge sofa, soaking tub, and bespoke concierge care.',
        210,
        3,
        'King Bed + Lounge Sofa',
        460,
        'Ocean View, Free Wi-Fi, King Bed, Soaking Tub, Lounge Area, 24/7 Room Service, Espresso Bar',
        '/assets/images/room-deluxe-1.jpg',
        'available',
        1
      ],
      [
        '302',
        'Executive Horizon Deluxe',
        'Deluxe',
        'Upper-floor executive deluxe room offering floor-to-ceiling skyline vistas, fast fiber connectivity, and luxury bath amenities.',
        230,
        3,
        'King Bed',
        480,
        'Skyline View, Free Wi-Fi, Executive Lounge Access, Smart TV, Rain Shower, Minibar',
        '/assets/images/room-deluxe-2.jpg',
        'available',
        0
      ],
      [
        '401',
        'Azure Presidential Suite',
        'Suite',
        'Signature two-room presidential suite pairing a grand royal-blue living salon with a private master bedroom, dining bar, and sunset terrace.',
        360,
        4,
        'Master King + Sofa Bed',
        780,
        'Separate Living Room, Panoramic Terrace, Free Wi-Fi, Butler Service, Jacuzzi Tub, Airport Transfer',
        '/assets/images/room-suite-1.jpg',
        'available',
        1
      ],
      [
        '402',
        'Royal Panoramic Suite',
        'Suite',
        'Top-floor penthouse suite built for families and VIP stays with sweeping wraparound views, marble bath sanctuary, and private dining space.',
        420,
        5,
        'Master King + Queen Daybed',
        920,
        'Penthouse Terrace, Wraparound Ocean View, Jacuzzi, Private Dining, Butler Service, Lounge Access',
        '/assets/images/room-suite-2.jpg',
        'available',
        0
      ]
    ];

    for (const r of seedRooms) {
      insertRoom.run(...r);
    }
  }

  const bookingCount = db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count;
  if (bookingCount === 0) {
    const john = db.prepare('SELECT id, full_name, email, phone FROM users WHERE email = ?').get('john.doe@example.com');
    const priya = db.prepare('SELECT id, full_name, email, phone FROM users WHERE email = ?').get('priya.sharma@example.com');
    const room201 = db.prepare('SELECT id, price_per_night FROM rooms WHERE room_number = ?').get('201');
    const room301 = db.prepare('SELECT id, price_per_night FROM rooms WHERE room_number = ?').get('301');

    const insertBooking = db.prepare(`
      INSERT INTO bookings (
        booking_id, user_id, room_id, check_in_date, check_out_date,
        guests, nights, total_price, guest_name, guest_email, guest_phone,
        special_requests, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (john && room201) {
      const ci1 = addDaysISO(45);
      const co1 = addDaysISO(48);
      const n1 = calculateNights(ci1, co1);
      insertBooking.run(
        'BK-20260001-SEED01',
        john.id,
        room201.id,
        ci1,
        co1,
        2,
        n1,
        Number((n1 * room201.price_per_night).toFixed(2)),
        john.full_name,
        john.email,
        john.phone,
        'High floor balcony preferred.',
        'confirmed'
      );
    }

    if (priya && room301) {
      const ci2 = addDaysISO(50);
      const co2 = addDaysISO(52);
      const n2 = calculateNights(ci2, co2);
      insertBooking.run(
        'BK-20260002-SEED02',
        priya.id,
        room301.id,
        ci2,
        co2,
        2,
        n2,
        Number((n2 * room301.price_per_night).toFixed(2)),
        priya.full_name,
        priya.email,
        priya.phone,
        'Early check-in requested if available.',
        'confirmed'
      );
    }
  }
}

module.exports = {
  db,
  DB_PATH,
  getTodayISO,
  addDaysISO,
  calculateNights,
  initializeDatabase
};
