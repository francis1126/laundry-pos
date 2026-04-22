# Laundry POS System

A professional Point of Sale system for laundry businesses built with Next.js, TypeScript, and Supabase.

## Features

- **User Authentication**: Secure login/signup with Supabase Auth
- **Order Management**: Create, view, edit, and delete laundry orders
- **Customer Management**: Track customer information including name, address, and contact details
- **Receipt Printing**: Professional receipt generation with print functionality
- **Real-time Updates**: Live order status tracking
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (Database, Authentication, Storage)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Supabase project set up
3. Git installed

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/laundry-pos.git
cd laundry-pos
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run the SQL scripts in your Supabase SQL Editor:

1. `database-update.sql` - Creates/updates tables
2. `rls-policies.sql` - Sets up Row Level Security policies

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
laundry-pos/
|-- app/
|   |-- login/          # Login page
|   |-- signup/         # Signup page
|   |-- signup-quick/   # Quick signup (no email confirmation)
|   |-- page.tsx        # Main dashboard
|   |-- layout.tsx      # Root layout
|   |-- globals.css     # Global styles
|-- components/
|   |-- Receipt.tsx     # Receipt component
|-- lib/
|   |-- supabase.js     # Supabase client configuration
|-- types/
|   |-- index.ts        # TypeScript interfaces
|-- vercel.json         # Vercel configuration
|-- .gitignore          # Git ignore file
```

## Usage

1. **Sign Up**: Create an account using the signup page
2. **Login**: Access the dashboard with your credentials
3. **Create Orders**: Add new laundry orders with customer details
4. **Manage Orders**: View, edit, or delete existing orders
5. **Print Receipts**: Generate professional receipts for customers

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Click "Deploy"

3. **Environment Variables in Vercel**:
   - Go to your Vercel project settings
   - Add the same environment variables as in `.env.local`

### Automatic Deployment

Once connected to GitHub, Vercel will automatically deploy:
- On every push to main branch
- On every pull request

## Database Schema

### Customers Table
- `id` (UUID, Primary Key)
- `name` (TEXT)
- `address` (TEXT)
- `contact_number` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Orders Table
- `id` (UUID, Primary Key)
- `customer_id` (UUID, Foreign Key)
- `weight` (DECIMAL)
- `total_price` (DECIMAL)
- `status` (TEXT: 'Pending', 'In Progress', 'Completed', 'Cancelled')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact:
- Email: support@laundrypos.com
- GitHub Issues: [Create an issue](https://github.com/your-username/laundry-pos/issues)
