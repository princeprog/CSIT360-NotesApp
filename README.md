# CSIT360 Notes App

A full-stack notes management application with blockchain integration, built with Spring Boot, React, and MySQL. This application allows users to create, view, update, and delete notes, with transaction history stored on the Cardano blockchain.

## 🚀 Features

- **CRUD Operations**: Create, read, update, and delete notes
- **Blockchain Integration**: Transaction history recorded on Cardano blockchain
- **Wallet Connection**: Connect with Cardano wallets for blockchain transactions
- **Responsive UI**: Modern, responsive interface built with React and Tailwind CSS
- **RESTful API**: Backend API built with Spring Boot
- **Database Persistence**: MySQL database for reliable data storage

## 🛠️ Technology Stack

### Backend
- **Spring Boot** 3.4.11 (Java 21)
- **MySQL** - Database
- **Flyway** - Database migrations
- **Maven** - Dependency management
- **Blockfrost API** - Cardano blockchain integration

### Frontend
- **React** 19.1.1
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Cardano SDK** - Blockchain integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Java Development Kit (JDK)** 21 or higher
- **Node.js** 18 or higher and npm
- **MySQL** 8.0 or higher
- **Maven** 3.6 or higher (optional, wrapper included)
- **Git** for cloning the repository

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/princeprog/CSIT360-NotesApp.git
cd CSIT360-NotesApp
```

### 2. Database Setup

1. Start your MySQL server

2. Create a new database:
```sql
CREATE DATABASE notesapp;
```

3. (Optional) Create a dedicated database user:
```sql
CREATE USER 'notesapp_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON notesapp.* TO 'notesapp_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Backend Setup

1. Navigate to the backend directory:
```bash
cd Backend/nabunturan
```

2. Configure the application properties:

   Open `src/main/resources/application.properties` and update the database credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/notesapp
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```

3. Configure Blockfrost API (for Cardano blockchain integration):

   Create a `.env` file in the `Backend/nabunturan` directory:
   ```env
   BLOCKFROST_PROJECT_ID=your_blockfrost_project_id
   BLOCKFROST_API_URL=https://cardano-preview.blockfrost.io/api/v0
   ```

   > **Note**: Get your Blockfrost Project ID from [blockfrost.io](https://blockfrost.io/)

4. Build and run the backend:

   **Using Maven Wrapper (Recommended):**
   ```bash
   # Windows
   .\mvnw.cmd clean install
   .\mvnw.cmd spring-boot:run

   # Linux/Mac
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

   **Using Maven:**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

5. The backend server will start at `http://localhost:8080`

### 4. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd Frontend/notes-app
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure API endpoint:

   If your backend is running on a different port, update the API base URL in the frontend configuration files.

4. Start the development server:
```bash
npm run dev
```

5. The frontend application will start at `http://localhost:5173` (or the next available port)

## 🎯 Usage

1. Open your browser and navigate to `http://localhost:5173`
2. You can now:
   - Create new notes
   - View all notes
   - Edit existing notes
   - Delete notes
   - Connect your Cardano wallet for blockchain transactions
   - View transaction history

## 📁 Project Structure

```
CSIT360-NotesApp/
├── Backend/
│   └── nabunturan/
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/com/notesapp/nabunturan/
│       │   │   │   ├── Config/          # Configuration files
│       │   │   │   ├── Controller/      # REST controllers
│       │   │   │   ├── Entity/          # JPA entities
│       │   │   │   ├── Repository/      # Data repositories
│       │   │   │   └── Service/         # Business logic
│       │   │   └── resources/
│       │   │       └── application.properties
│       │   └── test/
│       └── pom.xml
└── Frontend/
    └── notes-app/
        ├── src/
        │   ├── Components/      # React components
        │   ├── context/         # Context providers
        │   ├── Pages/           # Page components
        │   └── App.jsx
        └── package.json
```

## 🔌 API Endpoints

### Notes API

- `GET /api/notes` - Get all notes
- `GET /api/notes/{id}` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/{id}` - Update a note
- `DELETE /api/notes/{id}` - Delete a note

### Transactions API

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/{id}` - Get a specific transaction
- `POST /api/transactions` - Create a new transaction

## 🧪 Running Tests

### Backend Tests
```bash
cd Backend/nabunturan
./mvnw test
```

### Frontend Tests
```bash
cd Frontend/notes-app
npm run test
```

## 🏗️ Building for Production

### Backend
```bash
cd Backend/nabunturan
./mvnw clean package
java -jar target/nabunturan-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
cd Frontend/notes-app
npm run build
npm run preview
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify MySQL is running
- Check database credentials in `application.properties`
- Ensure the `notesapp` database exists

**Port Already in Use**
- Backend: Change the port in `application.properties`: `server.port=8081`
- Frontend: Vite will automatically use the next available port

**Maven Build Errors**
- Ensure Java 21 is installed: `java -version`
- Clear Maven cache: `./mvnw clean`

**npm Installation Errors**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## 📝 License

This project is part of the CSIT360 course.

## 👥 Contributors

- Al Prince Llavan
- Brett Wesley Arda
- Michael Anthony Yong
- Ivan Jay Adoptante
- James Wolfe
- Mark Christian Garing

## 📧 Contact

For questions or support, please contact alprincellavan2019@gmail.com

---

**Note**: This application uses the Cardano Preview Testnet for blockchain transactions. No real ADA is required for testing.
asbdsadvjshagdjsahgd