# CSIT360 Notes App - Project Defense Study Notes

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design](#architecture--design)
4. [Core Features](#core-features)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Database Design](#database-design)
8. [Blockchain Integration](#blockchain-integration)
9. [API Endpoints](#api-endpoints)
10. [Key Challenges & Solutions](#key-challenges--solutions)
11. [Security Considerations](#security-considerations)
12. [Testing & Deployment](#testing--deployment)
13. [Possible Defense Questions](#possible-defense-questions)

---

## 1. Project Overview

### What is the CSIT360 Notes App?
A **full-stack web application** that allows users to create, manage, and store notes with **blockchain integration** for immutable transaction history tracking using the Cardano blockchain.

### Key Objectives:
- Provide a user-friendly notes management system
- Integrate blockchain technology for transaction transparency
- Implement real-time status tracking for blockchain transactions
- Create a responsive, modern UI/UX
- Ensure data persistence and reliability

### Project Significance:
- Demonstrates practical use of blockchain in web applications
- Combines traditional database storage with decentralized technology
- Showcases full-stack development skills (Frontend + Backend + Database + Blockchain)

---

## 2. Technology Stack

### Backend Technologies
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Java** | 21 | Primary programming language |
| **Spring Boot** | 3.4.11 | Backend framework |
| **Spring Data JPA** | - | Database ORM |
| **Spring Web** | - | RESTful API creation |
| **Spring Validation** | - | Input validation |
| **MySQL** | 8.0+ | Relational database |
| **Flyway** | - | Database migrations |
| **Maven** | 3.6+ | Build tool & dependency management |
| **Blockfrost API** | - | Cardano blockchain interaction |
| **Dotenv Java** | 3.0.0 | Environment variable management |

### Frontend Technologies
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.1.1 | UI framework |
| **Vite** | 7.2.2 | Build tool & dev server |
| **React Router** | 7.9.1 | Client-side routing |
| **Axios** | 1.13.2 | HTTP client for API calls |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **Blaze Cardano SDK** | 0.2.44 | Cardano wallet integration |
| **Cardano Serialization Lib** | 15.0.3 | Blockchain transaction building |
| **Lucide React** | 0.544.0 | Icon library |

### Development Tools
- **Git** - Version control
- **VS Code** - IDE
- **Postman** - API testing
- **MySQL Workbench** - Database management

---

## 3. Architecture & Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  (React App - Browser)                                       │
│  - User Interface                                            │
│  - Wallet Connection (Cardano)                              │
│  - Real-time Updates                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST API
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               APPLICATION LAYER                              │
│  (Spring Boot Backend - Port 8080)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Controllers  │  │  Services    │  │   DTOs       │     │
│  │  - Notes     │  │  - Notes     │  │  - Request   │     │
│  │  - Trans.    │  │  - Trans.    │  │  - Response  │     │
│  └──────────────┘  │  - Blockfrost│  └──────────────┘     │
│                     └──────────────┘                         │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
          ┌───────────▼─────────┐  ┌─────▼──────────┐
          │   DATABASE LAYER    │  │  BLOCKCHAIN    │
          │   (MySQL)           │  │  (Cardano)     │
          │  - notes table      │  │  - Blockfrost  │
          │  - transactions     │  │  - Preview Net │
          └─────────────────────┘  └────────────────┘
```

### Design Patterns Used

1. **MVC (Model-View-Controller)**
   - **Model**: Entity classes (Note, Transaction)
   - **View**: React components
   - **Controller**: REST controllers

2. **Repository Pattern**
   - Abstraction layer for data access
   - Separates business logic from data access logic

3. **DTO Pattern (Data Transfer Object)**
   - Separate data models for API requests/responses
   - Decouples internal entities from external API

4. **Service Layer Pattern**
   - Business logic separated from controllers
   - Promotes code reusability and testability

5. **Context API Pattern (React)**
   - Global state management
   - Wallet and Notes contexts

---

## 4. Core Features

### 1. Note Management (CRUD Operations)
- ✅ **Create** new notes with title, content, category, and pin status
- ✅ **Read** all notes or filter by status/wallet
- ✅ **Update** existing notes
- ✅ **Delete** notes

### 2. Blockchain Integration
- ✅ **Transaction tracking** for all note operations
- ✅ **Transaction status monitoring** (PENDING → SUBMITTED → CONFIRMED)
- ✅ **Automatic status polling** every 15 seconds
- ✅ **Transaction history** per note
- ✅ **Blockfrost API integration** for Cardano blockchain

### 3. Wallet Connection
- ✅ **Connect Cardano wallets** (Nami, Eternl, Flint, etc.)
- ✅ **Wallet address tracking** for ownership
- ✅ **Sign transactions** with connected wallet

### 4. Real-time Updates
- ✅ **Progress tracking** (10-step transaction process)
- ✅ **Status notifications** (toast messages)
- ✅ **Pending transaction indicators**
- ✅ **Auto-refresh** when transactions confirm

### 5. User Interface
- ✅ **Responsive design** (mobile-friendly)
- ✅ **Modern UI** with Tailwind CSS
- ✅ **Loading states** and error handling
- ✅ **Note filtering** and search
- ✅ **Transaction history modal**

---

## 5. Backend Implementation

### Project Structure
```
com.notesapp.nabunturan/
├── NabunturanApplication.java     # Main Spring Boot application
├── Config/                         # Configuration classes
│   ├── CorsConfig.java            # Cross-origin configuration
│   ├── DotenvConfig.java          # Environment variable loading
│   └── SchedulingConfig.java      # Task scheduling setup
├── Controller/                     # REST API endpoints
│   ├── NotesController.java       # Note CRUD operations
│   └── TransactionController.java # Transaction operations
├── DTO/                            # Data Transfer Objects
│   ├── CreateNoteWithTxRequest.java
│   ├── UpdateNoteWithTxRequest.java
│   ├── DeleteNoteWithTxRequest.java
│   ├── NoteWithStatusResponse.java
│   ├── TransactionStatusResponse.java
│   └── TransactionHistoryResponse.java
├── Entity/                         # Database entities
│   ├── Note.java                  # Note model
│   └── Transaction.java           # Transaction model
├── Exception/                      # Custom exceptions
│   ├── GlobalExceptionHandler.java
│   ├── BlockfrostApiException.java
│   ├── TransactionNotFoundException.java
│   └── InvalidTransactionStatusException.java
├── Repository/                     # Data access layer
│   ├── NotesRepository.java
│   └── TransactionRepository.java
├── Service/                        # Business logic
│   ├── NotesService.java
│   ├── TransactionService.java
│   └── BlockfrostService.java
├── Validator/                      # Custom validators
└── Worker/                         # Background tasks
    └── TransactionStatusWorker.java
```

### Key Components Explained

#### 1. **NabunturanApplication.java**
```java
@SpringBootApplication
@EnableScheduling
public class NabunturanApplication {
    public static void main(String[] args) {
        SpringApplication.run(NabunturanApplication.class, args);
    }
}
```
- **Entry point** of the application
- `@EnableScheduling` enables background task scheduling

#### 2. **Controllers**
- **Purpose**: Handle HTTP requests and return responses
- **Annotations**: `@RestController`, `@RequestMapping`, `@CrossOrigin`
- **Methods**: Map to HTTP methods (GET, POST, PUT, DELETE)

**Example - NotesController.java**:
```java
@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
public class NotesController {
    
    @PostMapping
    public ResponseEntity<NoteWithStatusResponse> createNote(
        @Valid @RequestBody CreateNoteWithTxRequest request) {
        // Create note logic
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<NoteWithStatusResponse> getNoteById(
        @PathVariable Long id) {
        // Get note logic
    }
}
```

#### 3. **Services**
- **Purpose**: Contain business logic
- **NotesService**: Handle note operations
- **TransactionService**: Manage transactions
- **BlockfrostService**: Interact with Cardano blockchain

#### 4. **Entities**
- **Note.java**: Represents a note in the database
  - Fields: id, title, content, isPinned, category, status, txHash, walletAddress
  - Relationships: One-to-Many with Transaction
  
- **Transaction.java**: Represents a blockchain transaction
  - Fields: id, txHash, status, walletAddress, blockHeight, confirmedAt
  - Relationships: Many-to-One with Note

#### 5. **Repositories**
- **Purpose**: Data access layer using Spring Data JPA
- **Auto-generated queries** from method names
- **Custom queries** using `@Query` annotation

#### 6. **Configuration Classes**
- **CorsConfig**: Allows frontend to communicate with backend
- **DotenvConfig**: Loads environment variables from `.env` file
- **SchedulingConfig**: Configures background task execution

---

## 6. Frontend Implementation

### Project Structure
```
src/
├── main.jsx                    # Application entry point
├── App.jsx                     # Main App component with routing
├── Components/                 # Reusable UI components
│   ├── NoteCard.jsx           # Note display card
│   ├── NoteForm.jsx           # Note create/edit form
│   ├── WalletConnect.jsx      # Wallet connection button
│   ├── TransactionProgress.jsx # Transaction progress modal
│   ├── TransactionNotifications.jsx # Toast notifications
│   ├── LoadingOverlay.jsx     # Loading spinner
│   ├── Toast.jsx              # Toast message component
│   └── DeleteConfirmationModal.jsx
├── Pages/                      # Page components
│   ├── Home.jsx               # Main landing page
│   ├── NotesList.jsx          # List all notes
│   ├── NoteView.jsx           # View single note
│   ├── CreateNote.jsx         # Create new note page
│   ├── EditNote.jsx           # Edit note page
│   └── History.jsx            # Transaction history page
├── context/                    # React Context for state
│   ├── NotesContext.jsx       # Notes global state
│   └── WalletContext.jsx      # Wallet global state
├── hooks/                      # Custom React hooks
│   └── useStatusPolling.js    # Auto-polling hook
├── utils/                      # Utility functions
│   ├── chunkingUtils.js       # Data chunking for blockchain
│   ├── errorHandling.js       # Error handling utilities
│   └── blockfrostTest.js      # Blockchain testing
└── config/                     # Configuration
    └── blockchain.js           # Blockchain constants
```

### Key Frontend Concepts

#### 1. **React Router**
- Client-side routing for single-page application
- Routes defined in `App.jsx`

```jsx
<Routes>
  <Route path="/" element={<Navigate to="/notes" />} />
  <Route path="/notes" element={<Home />} />
  <Route path="/notes/:id" element={<NoteView />} />
  <Route path="/create" element={<CreateNote />} />
  <Route path="/edit/:id" element={<EditNote />} />
  <Route path="/history" element={<History />} />
</Routes>
```

#### 2. **Context API**
- **NotesContext**: Manages notes data and operations
- **WalletContext**: Manages wallet connection state

**Benefits**:
- Avoid prop drilling
- Global state accessible anywhere
- Centralized state management

#### 3. **Custom Hooks**
- **useStatusPolling**: Automatically polls transaction status
  - Checks every 15 seconds
  - Starts/stops based on pending transactions
  - Updates notes when status changes

#### 4. **Axios for API Calls**
```javascript
const API_URL = 'http://localhost:8080/api';

// Create note
const createNote = async (noteData) => {
  const response = await axios.post(`${API_URL}/notes`, noteData);
  return response.data;
};
```

#### 5. **Wallet Integration**
- Uses Cardano wallet browser extensions
- Sign transactions with wallet
- Read wallet address

---

## 7. Database Design

### Tables

#### 1. **notes** Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT (PK) | Primary key, auto-increment |
| `title` | VARCHAR(255) | Note title (required) |
| `content` | TEXT | Note content |
| `is_pinned` | BOOLEAN | Pin status |
| `category` | VARCHAR(100) | Note category |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |
| `created_by_wallet` | VARCHAR(150) | Creator wallet address |
| `on_chain` | BOOLEAN | Blockchain status |
| `latest_tx_hash` | VARCHAR(64) | Latest transaction hash |
| `status` | VARCHAR(50) | Current status |
| `tx_hash` | VARCHAR(64) | Transaction hash |
| `wallet_address` | VARCHAR(150) | Owner wallet address |
| `last_updated_tx_hash` | VARCHAR(64) | Last update tx hash |

**Indexes:**
- `idx_notes_status` on `status`
- `idx_notes_tx_hash` on `tx_hash`
- `idx_notes_wallet_address` on `wallet_address`
- `idx_notes_created_at` on `created_at`

#### 2. **transactions** Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT (PK) | Primary key, auto-increment |
| `note_id` | BIGINT (FK) | Foreign key to notes table |
| `tx_hash` | VARCHAR(64) | Cardano transaction hash |
| `status` | VARCHAR(50) | Transaction status |
| `wallet_address` | VARCHAR(150) | Wallet that initiated |
| `metadata_json` | TEXT | Transaction metadata |
| `block_height` | BIGINT | Block number on chain |
| `block_time` | DATETIME | Block timestamp |
| `created_at` | DATETIME | Created timestamp |
| `confirmed_at` | DATETIME | Confirmation timestamp |
| `last_checked_at` | DATETIME | Last status check |
| `retry_count` | INT | Retry attempts |
| `error_message` | TEXT | Error details if failed |

**Indexes:**
- `idx_status` on `status`
- `idx_tx_hash` on `tx_hash`
- `idx_wallet_address` on `wallet_address`
- `idx_created_at` on `created_at`

### Relationships
- **One-to-Many**: One Note can have many Transactions
- **Foreign Key**: `transactions.note_id` references `notes.id`
- **Cascade**: When a note is deleted, all its transactions are also deleted

---

## 8. Blockchain Integration

### Why Cardano?
- **Proof of Stake** blockchain (energy efficient)
- **Low transaction fees**
- **Fast confirmation times**
- **Metadata support** for storing note information
- **Active development community**

### Blockfrost API
- **Purpose**: Interact with Cardano blockchain without running a full node
- **API Endpoint**: `https://cardano-preview.blockfrost.io/api/v0`
- **Authentication**: Project ID required
- **Network**: Preview Testnet (for development)

### Transaction Lifecycle

```
1. USER ACTION (Create/Update/Delete Note)
   ↓
2. CREATE PENDING TRANSACTION
   Status: PENDING
   ↓
3. BUILD CARDANO TRANSACTION
   - Create transaction metadata
   - Calculate fees
   - Prepare unsigned transaction
   ↓
4. SIGN WITH WALLET
   - User confirms in wallet extension
   - Wallet signs transaction
   Status: SUBMITTED
   ↓
5. SUBMIT TO BLOCKCHAIN
   - Send to Cardano network via Blockfrost
   - Receive transaction hash
   ↓
6. SAVE TO DATABASE
   - Store transaction hash
   - Save note with status
   Status: PROCESSING
   ↓
7. MONITOR STATUS (Background Worker)
   - Poll Blockfrost API every 15 seconds
   - Check transaction confirmation
   ↓
8. CONFIRMATION
   - Transaction included in block
   - Update status to CONFIRMED
   Status: CONFIRMED
```

### Transaction Statuses
- **PENDING**: Transaction created, awaiting submission
- **SUBMITTED**: Transaction signed and submitted to blockchain
- **PROCESSING**: Waiting for blockchain confirmation
- **CONFIRMED**: Transaction confirmed on blockchain
- **FAILED**: Transaction failed or rejected

### Metadata Structure
Notes are stored on the blockchain as transaction metadata:
```json
{
  "674": {
    "noteId": 123,
    "action": "CREATE",
    "title": "My Note Title",
    "content": "Note content here...",
    "timestamp": 1702123456,
    "walletAddress": "addr_test1..."
  }
}
```
- **Label 674**: Custom metadata label for notes app
- **Immutable**: Once on blockchain, data cannot be changed
- **Transparent**: Anyone can verify transactions

---

## 9. API Endpoints

### Notes Endpoints

#### 1. Create Note
```
POST /api/notes
Content-Type: application/json

Request Body:
{
  "title": "My Note",
  "content": "Note content",
  "isPinned": false,
  "category": "Work",
  "txHash": "abc123...",
  "walletAddress": "addr_test1..."
}

Response: 201 Created
{
  "id": 1,
  "title": "My Note",
  "content": "Note content",
  "isPinned": false,
  "category": "Work",
  "status": "PENDING",
  "txHash": "abc123...",
  "walletAddress": "addr_test1...",
  "createdAt": "2025-12-09T10:00:00",
  "updatedAt": "2025-12-09T10:00:00"
}
```

#### 2. Get All Notes
```
GET /api/notes
Optional Query Parameters:
  - walletAddress: Filter by wallet
  - status: Filter by status

Response: 200 OK
[
  {
    "id": 1,
    "title": "My Note",
    "content": "Note content",
    ...
  }
]
```

#### 3. Get Note by ID
```
GET /api/notes/{id}

Response: 200 OK
{
  "id": 1,
  "title": "My Note",
  ...
}
```

#### 4. Update Note
```
PUT /api/notes/{id}
Content-Type: application/json

Request Body:
{
  "noteId": 1,
  "title": "Updated Title",
  "content": "Updated content",
  "isPinned": true,
  "category": "Personal",
  "txHash": "xyz789...",
  "walletAddress": "addr_test1..."
}

Response: 200 OK
{
  "id": 1,
  "title": "Updated Title",
  ...
}
```

#### 5. Delete Note
```
DELETE /api/notes/{id}
Content-Type: application/json

Request Body:
{
  "noteId": 1,
  "txHash": "def456...",
  "walletAddress": "addr_test1..."
}

Response: 204 No Content
```

### Transaction Endpoints

#### 1. Get Transaction Status
```
GET /api/transactions/{txHash}/status

Response: 200 OK
{
  "txHash": "abc123...",
  "status": "CONFIRMED",
  "blockHeight": 12345,
  "confirmations": 10,
  "confirmedAt": "2025-12-09T10:05:00"
}
```

#### 2. Get Transaction History
```
GET /api/transactions/note/{noteId}

Response: 200 OK
[
  {
    "id": 1,
    "txHash": "abc123...",
    "status": "CONFIRMED",
    "walletAddress": "addr_test1...",
    "createdAt": "2025-12-09T10:00:00",
    "confirmedAt": "2025-12-09T10:05:00"
  }
]
```

#### 3. Get All Transactions
```
GET /api/transactions
Optional Query Parameters:
  - walletAddress: Filter by wallet
  - status: Filter by status

Response: 200 OK
[...]
```

---

## 10. Key Challenges & Solutions

### Challenge 1: Asynchronous Blockchain Transactions
**Problem**: Blockchain transactions take time to confirm (5-20 seconds or more)

**Solution**: 
- Implemented **status tracking system**
- Created **background worker** to poll transaction status
- Added **real-time UI updates** with notifications
- Used **optimistic UI updates** (show pending state immediately)

### Challenge 2: Wallet Integration Complexity
**Problem**: Different wallet extensions have different APIs

**Solution**:
- Used **Cardano Serialization Library** for standardization
- Implemented **error handling** for wallet connection failures
- Added **user-friendly messages** for wallet requirements

### Challenge 3: Data Consistency
**Problem**: Keeping database and blockchain in sync

**Solution**:
- Used **transaction records** to track all operations
- Implemented **retry logic** for failed transactions
- Added **status monitoring** to update database when confirmed

### Challenge 4: CORS Issues
**Problem**: Frontend (port 5173) couldn't communicate with backend (port 8080)

**Solution**:
- Configured **CORS in Spring Boot**
- Added `@CrossOrigin` annotations
- Created `CorsConfig` class for global CORS settings

### Challenge 5: Large Note Content
**Problem**: Blockchain has size limits for metadata

**Solution**:
- Implemented **data chunking** utilities
- Store only **essential metadata** on-chain
- Keep **full content in database**

---

## 11. Security Considerations

### 1. Input Validation
- **Bean Validation** annotations (`@NotBlank`, `@Size`)
- **Custom validators** for specific business rules
- **Sanitization** of user inputs

### 2. CORS Configuration
- Controlled cross-origin requests
- Specified allowed origins (configurable)
- Limited HTTP methods

### 3. Error Handling
- **Global exception handler** catches all errors
- **Custom exceptions** for specific scenarios
- **No sensitive data** in error messages

### 4. Wallet Security
- **User signs transactions** in their wallet
- **Private keys never leave wallet**
- **Wallet address verification**

### 5. Environment Variables
- **Sensitive data** stored in `.env` files
- **Not committed to Git** (in `.gitignore`)
- **Different configs** for dev/prod

### 6. Database Security
- **Parameterized queries** (JPA prevents SQL injection)
- **Connection pooling** for performance
- **Indexes** for faster queries

---

## 12. Testing & Deployment

### Testing Strategy

#### Backend Testing
- **Unit Tests**: Test individual methods in isolation
- **Integration Tests**: Test API endpoints
- **Repository Tests**: Test database operations

#### Frontend Testing
- **Component Testing**: Test individual React components
- **Integration Testing**: Test user flows
- **Manual Testing**: User acceptance testing

### Deployment Considerations

#### Backend Deployment
1. **Build JAR file**: `mvn clean package`
2. **Run JAR**: `java -jar nabunturan-0.0.1-SNAPSHOT.jar`
3. **Environment**: Configure production database and API keys
4. **Server**: Deploy to cloud (AWS, Azure, Heroku)

#### Frontend Deployment
1. **Build**: `npm run build`
2. **Static files**: Output in `dist/` folder
3. **Deploy**: Upload to Netlify, Vercel, or GitHub Pages
4. **Environment**: Configure production API URL

#### Database Setup
1. Create production MySQL database
2. Run Flyway migrations
3. Configure connection in `application.properties`

---

## 13. Possible Defense Questions

### Technical Questions

#### Q1: Why did you choose Spring Boot for the backend?
**Answer**: Spring Boot provides:
- **Rapid development** with auto-configuration
- **Built-in features** (security, data access, web services)
- **Large ecosystem** and community support
- **Production-ready** features (health checks, metrics)
- **Easy integration** with databases and third-party APIs

#### Q2: Explain how the transaction status tracking works.
**Answer**: 
1. When a note operation occurs, a transaction record is created with status PENDING
2. The transaction is submitted to Cardano blockchain via Blockfrost API
3. A background worker runs every 15 seconds checking pending transactions
4. The worker queries Blockfrost to check if transaction is confirmed
5. When confirmed, status is updated to CONFIRMED and UI is notified
6. Frontend polls backend every 15 seconds for status updates
7. Toast notifications inform user when transactions are confirmed

#### Q3: What is the purpose of DTOs (Data Transfer Objects)?
**Answer**: DTOs serve several purposes:
- **Separation of concerns**: API models separate from database entities
- **Security**: Don't expose internal entity structure
- **Validation**: Apply specific validation rules for API requests
- **Flexibility**: Change internal models without affecting API
- **Documentation**: Clear API contracts for frontend developers

#### Q4: How do you handle errors in the application?
**Answer**: 
- **Global Exception Handler**: Catches all exceptions centrally
- **Custom Exceptions**: Specific exceptions for different scenarios (TransactionNotFoundException, BlockfrostApiException)
- **HTTP Status Codes**: Return appropriate codes (400, 404, 500)
- **User-friendly messages**: Clear error messages for users
- **Logging**: Log errors for debugging and monitoring
- **Frontend error handling**: Try-catch blocks and error state management

#### Q5: Explain the relationship between Note and Transaction entities.
**Answer**: 
- **One-to-Many relationship**: One Note can have multiple Transactions
- **Bidirectional**: Note references Transactions, Transaction references Note
- **Cascade operations**: Deleting a note deletes all its transactions
- **Lazy loading**: Transactions loaded only when needed (performance optimization)
- **JSON handling**: `@JsonManagedReference` and `@JsonBackReference` prevent infinite recursion

#### Q6: Why use React Context instead of props?
**Answer**: 
- **Avoid prop drilling**: No need to pass props through multiple levels
- **Global state**: State accessible from any component
- **Clean code**: Reduces component coupling
- **Reusability**: Context providers wrap multiple components
- **Performance**: Optimized re-renders only for consumers

#### Q7: What is the purpose of Flyway?
**Answer**: 
- **Database version control**: Track database schema changes
- **Migration management**: Apply changes in order
- **Consistency**: Same database structure across environments
- **Rollback capability**: Revert changes if needed
- **Team collaboration**: Share schema changes via code

#### Q8: How does the wallet connection work?
**Answer**: 
1. User clicks "Connect Wallet" button
2. App detects available Cardano wallet extensions in browser
3. User selects wallet and authorizes connection
4. App receives wallet API object
5. App can now request wallet address and sign transactions
6. Wallet address stored in context for session
7. User must approve each transaction signature in wallet

### Conceptual Questions

#### Q9: What are the advantages of integrating blockchain?
**Answer**: 
- **Immutability**: Transaction history cannot be altered
- **Transparency**: Anyone can verify transactions
- **Decentralization**: No single point of control
- **Proof of ownership**: Wallet signatures prove authorship
- **Audit trail**: Complete history of all operations
- **Innovation**: Demonstrates modern technology adoption

#### Q10: What improvements could be made to the application?
**Answer**: 
- **Search functionality**: Search notes by keywords
- **Tags system**: Multiple tags per note instead of single category
- **Rich text editor**: Format note content with bold, italic, lists
- **File attachments**: Upload images and documents
- **Sharing**: Share notes with other users
- **Authentication**: User accounts and login system
- **Note encryption**: Encrypt sensitive notes
- **Mobile app**: Native iOS/Android apps
- **Offline support**: Work without internet connection
- **Export/Import**: Download notes as PDF or JSON
- **Collaboration**: Real-time collaborative editing

#### Q11: What is the difference between CREATE and SUBMITTED status?
**Answer**: 
- **PENDING**: Transaction record created in database but not yet submitted to blockchain
- **SUBMITTED**: Transaction signed by wallet and sent to Cardano network
- **PROCESSING**: Transaction in mempool waiting to be included in block
- **CONFIRMED**: Transaction included in block and confirmed on blockchain
- **FAILED**: Transaction rejected or failed to submit

#### Q12: Why use MySQL instead of NoSQL?
**Answer**: 
- **Structured data**: Notes have well-defined schema
- **Relationships**: Clear relationships between notes and transactions
- **ACID compliance**: Ensures data integrity
- **Mature technology**: Well-documented and reliable
- **Query power**: Complex queries with JOINs
- **Transaction support**: Database transactions for consistency

### Architecture Questions

#### Q13: Explain the MVC architecture in your project.
**Answer**: 
- **Model**: Entity classes (Note, Transaction) represent data structure
- **View**: React components render user interface
- **Controller**: Spring controllers handle HTTP requests and coordinate between model and view
- **Flow**: User interacts with View → Controller processes request → Service modifies Model → Response sent to View

#### Q14: How would you scale this application?
**Answer**: 
- **Database**: Implement read replicas, connection pooling, caching
- **Backend**: Deploy multiple instances with load balancer
- **Frontend**: Use CDN for static files
- **Caching**: Redis for frequently accessed data
- **Async processing**: Queue system for blockchain operations
- **Microservices**: Split into separate services (notes, transactions, blockchain)
- **Database sharding**: Partition data across multiple databases

#### Q15: What is the purpose of indexes in the database?
**Answer**: 
- **Faster queries**: Speed up SELECT queries with WHERE clauses
- **Common queries**: Index fields frequently used in searches (status, wallet_address, tx_hash)
- **Trade-off**: Slower writes for faster reads
- **Query optimization**: Database uses indexes to find data quickly

---

## Final Tips for Defense

### Do's:
✅ **Be confident** - You built this project, you know it best
✅ **Be honest** - If you don't know something, admit it
✅ **Explain clearly** - Use simple terms, avoid unnecessary jargon
✅ **Show enthusiasm** - Demonstrate your passion for the project
✅ **Prepare demo** - Have the application running and ready to show
✅ **Know your code** - Understand every part of the implementation
✅ **Practice answers** - Rehearse common questions

### Don'ts:
❌ **Don't memorize** - Understand concepts, don't just repeat
❌ **Don't panic** - Take your time to think before answering
❌ **Don't make up answers** - Better to say "I don't know" than give wrong information
❌ **Don't criticize** - If asked about limitations, frame them as "future improvements"
❌ **Don't rush** - Speak slowly and clearly

### Key Points to Emphasize:
1. **Full-stack capability** - You built both frontend and backend
2. **Modern technologies** - Used latest versions and best practices
3. **Blockchain integration** - Practical application of emerging technology
4. **Problem-solving** - How you overcame challenges
5. **Real-world applicability** - Actual use cases for the application

---

## Quick Reference

### Start Backend
```bash
cd Backend/nabunturan
./mvnw spring-boot:run
```

### Start Frontend
```bash
cd Frontend/notes-app
npm run dev
```

### Database Connection
- **Host**: localhost:3306
- **Database**: notesapp
- **Username**: root
- **Password**: [your password]

### API Base URL
- **Backend**: http://localhost:8080/api
- **Frontend**: http://localhost:5173

---

## Summary

This project demonstrates:
- ✅ Full-stack web development skills
- ✅ Integration of blockchain technology
- ✅ RESTful API design and implementation
- ✅ Modern frontend development with React
- ✅ Database design and management
- ✅ Asynchronous programming and state management
- ✅ Error handling and user experience design

**Good luck with your defense! You've got this! 🚀**
