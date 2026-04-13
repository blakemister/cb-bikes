-- ============================================
-- CB Bikes & Phil's Fabs Database
-- SQL Server DDL
-- ============================================

CREATE DATABASE CBBikes;
GO
USE CBBikes;
GO

-- Independent tables first (no FKs)

CREATE TABLE Location (
    LocationID      INT IDENTITY(1,1) PRIMARY KEY,
    LocationName    VARCHAR(100)    NOT NULL,
    StreetAddress   VARCHAR(100)    NOT NULL,
    City            VARCHAR(50)     NOT NULL,
    State           CHAR(2)         NOT NULL,
    ZipCode         VARCHAR(10)     NOT NULL
);

CREATE TABLE Customer (
    CustomerID      INT IDENTITY(1,1) PRIMARY KEY,
    FirstName       VARCHAR(50)     NOT NULL,
    LastName        VARCHAR(50)     NOT NULL,
    StreetAddress   VARCHAR(100)    NULL,
    City            VARCHAR(50)     NULL,
    State           CHAR(2)         NULL,
    ZipCode         VARCHAR(10)     NULL
);

CREATE TABLE Supplier (
    SupplierID      INT IDENTITY(1,1) PRIMARY KEY,
    SupplierName    VARCHAR(100)    NOT NULL,
    StreetAddress   VARCHAR(100)    NULL,
    City            VARCHAR(50)     NULL,
    State           CHAR(2)         NULL,
    ZipCode         VARCHAR(10)     NULL,
    ContactName     VARCHAR(100)    NULL,
    ContactPhone    VARCHAR(20)     NULL,
    ContactEmail    VARCHAR(100)    NULL
);

CREATE TABLE Shareholder (
    ShareholderID   INT IDENTITY(1,1) PRIMARY KEY,
    Name            VARCHAR(100)    NOT NULL,
    OwnershipPercentage DECIMAL(5,2) NOT NULL
);

-- Customer multi-valued attribute tables

CREATE TABLE CustomerEmail (
    CustomerID      INT             NOT NULL,
    Email           VARCHAR(100)    NOT NULL,
    PRIMARY KEY (CustomerID, Email),
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
);

CREATE TABLE CustomerPhone (
    CustomerID      INT             NOT NULL,
    PhoneNumber     VARCHAR(20)     NOT NULL,
    PhoneType       VARCHAR(10)     NULL,
    PRIMARY KEY (CustomerID, PhoneNumber),
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
);

CREATE TABLE CustomerCyclingType (
    CustomerID      INT             NOT NULL,
    CyclingType     VARCHAR(20)     NOT NULL,
    PRIMARY KEY (CustomerID, CyclingType),
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
);

-- Product hierarchy

CREATE TABLE Product (
    ProductID       INT IDENTITY(1,1) PRIMARY KEY,
    ProductName     VARCHAR(150)    NOT NULL,
    Description     VARCHAR(500)    NULL,
    MSRP            DECIMAL(10,2)   NOT NULL,
    CostPrice       DECIMAL(10,2)   NOT NULL,
    ProductType     VARCHAR(10)     NOT NULL
        CHECK (ProductType IN ('Bike', 'Clothing', 'Part', 'Service')),
    SupplierID      INT             NULL,
    FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID)
);

CREATE TABLE Bike (
    ProductID       INT             PRIMARY KEY,
    FrameMaterial   VARCHAR(30)     NOT NULL,
    FrameSize       VARCHAR(10)     NOT NULL,
    BuildKit        VARCHAR(50)     NULL,
    SuspensionType  VARCHAR(30)     NULL,
    Drivetrain      VARCHAR(50)     NULL,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

CREATE TABLE Clothing (
    ProductID       INT             PRIMARY KEY,
    Size            VARCHAR(10)     NOT NULL,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

CREATE TABLE Part (
    ProductID       INT             PRIMARY KEY,
    Weight          DECIMAL(8,2)    NULL,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

CREATE TABLE Service (
    ProductID       INT             PRIMARY KEY,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

CREATE TABLE ServicePart (
    ServiceID       INT             NOT NULL,
    PartID          INT             NOT NULL,
    QuantityUsed    INT             NOT NULL DEFAULT 1,
    PRIMARY KEY (ServiceID, PartID),
    FOREIGN KEY (ServiceID) REFERENCES Service(ProductID),
    FOREIGN KEY (PartID) REFERENCES Part(ProductID)
);

-- Employee

CREATE TABLE Employee (
    EmployeeID      INT IDENTITY(1,1) PRIMARY KEY,
    FirstName       VARCHAR(50)     NOT NULL,
    LastName        VARCHAR(50)     NOT NULL,
    StreetAddress   VARCHAR(100)    NULL,
    City            VARCHAR(50)     NULL,
    State           CHAR(2)         NULL,
    ZipCode         VARCHAR(10)     NULL,
    EmployeeType    VARCHAR(15)     NOT NULL
        CHECK (EmployeeType IN ('Retail', 'Fabrication')),
    CommissionRate  DECIMAL(4,2)    NULL,
    Salary          DECIMAL(10,2)   NULL,
    LocationID      INT             NOT NULL,
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID)
);

CREATE TABLE EmployeeSkill (
    EmployeeID      INT             NOT NULL,
    Skill           VARCHAR(30)     NOT NULL,
    PRIMARY KEY (EmployeeID, Skill),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

-- Transactions

CREATE TABLE Sale (
    SaleID          INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID      INT             NOT NULL,
    EmployeeID      INT             NOT NULL,
    LocationID      INT             NOT NULL,
    SaleDate        DATE            NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID)
);

CREATE TABLE SaleLineItem (
    SaleID          INT             NOT NULL,
    ProductID       INT             NOT NULL,
    Quantity        INT             NOT NULL,
    UnitPrice       DECIMAL(10,2)   NOT NULL,
    PRIMARY KEY (SaleID, ProductID),
    FOREIGN KEY (SaleID) REFERENCES Sale(SaleID),
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

CREATE TABLE ServiceRecord (
    ServiceRecordID INT IDENTITY(1,1) PRIMARY KEY,
    SaleID          INT             NOT NULL,
    ServiceProductID INT            NOT NULL,
    EmployeeID      INT             NOT NULL,
    ServiceDate     DATE            NOT NULL,
    ServicePrice    DECIMAL(10,2)   NOT NULL,
    FOREIGN KEY (SaleID) REFERENCES Sale(SaleID),
    FOREIGN KEY (ServiceProductID) REFERENCES Service(ProductID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

-- ============================================
-- Addendum 2: Junior Bike Week 2027
-- ============================================

-- Event supertype (same pattern as Product)
CREATE TABLE Event (
    EventID         INT IDENTITY(1,1) PRIMARY KEY,
    EventName       VARCHAR(100)    NOT NULL,
    EventDate       DATE            NOT NULL,
    EventTime       TIME            NOT NULL,
    LocationID      INT             NOT NULL,
    RegistrationFee DECIMAL(10,2)   NOT NULL,
    AgeGroupBracket VARCHAR(20)     NOT NULL,
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID)
);

CREATE TABLE RaceEvent (
    EventID         INT             PRIMARY KEY,
    RaceType        VARCHAR(20)     NOT NULL
        CHECK (RaceType IN ('Downhill', 'XC', 'Short Track')),
    FOREIGN KEY (EventID) REFERENCES Event(EventID)
);

CREATE TABLE RecreationalEvent (
    EventID         INT             PRIMARY KEY,
    Description     VARCHAR(500)    NULL,
    FOREIGN KEY (EventID) REFERENCES Event(EventID)
);

CREATE TABLE Guardian (
    GuardianID      INT IDENTITY(1,1) PRIMARY KEY,
    FirstName       VARCHAR(50)     NOT NULL,
    LastName        VARCHAR(50)     NOT NULL,
    StreetAddress   VARCHAR(100)    NULL,
    City            VARCHAR(50)     NULL,
    State           CHAR(2)         NULL,
    ZipCode         VARCHAR(10)     NULL,
    CCNumber        VARCHAR(20)     NULL,
    CCExpiry        VARCHAR(7)      NULL,
    WaiverSigned    BIT             NOT NULL DEFAULT 0
);

CREATE TABLE Participant (
    ParticipantID   INT IDENTITY(1,1) PRIMARY KEY,
    FirstName       VARCHAR(50)     NOT NULL,
    LastName        VARCHAR(50)     NOT NULL,
    Age             INT             NOT NULL,
    StreetAddress   VARCHAR(100)    NULL,
    City            VARCHAR(50)     NULL,
    State           CHAR(2)         NULL,
    ZipCode         VARCHAR(10)     NULL,
    GuardianID      INT             NOT NULL,
    WaiverSigned    BIT             NOT NULL DEFAULT 0,
    FOREIGN KEY (GuardianID) REFERENCES Guardian(GuardianID)
);

CREATE TABLE EventRegistration (
    ParticipantID   INT             NOT NULL,
    EventID         INT             NOT NULL,
    RegistrationDate DATE           NOT NULL,
    PRIMARY KEY (ParticipantID, EventID),
    FOREIGN KEY (ParticipantID) REFERENCES Participant(ParticipantID),
    FOREIGN KEY (EventID) REFERENCES Event(EventID)
);

CREATE TABLE RaceResult (
    ParticipantID   INT             NOT NULL,
    EventID         INT             NOT NULL,
    FinishTime      TIME            NOT NULL,
    Placement       INT             NOT NULL,
    PRIMARY KEY (ParticipantID, EventID),
    FOREIGN KEY (ParticipantID) REFERENCES Participant(ParticipantID),
    FOREIGN KEY (EventID) REFERENCES RaceEvent(EventID)
);

CREATE TABLE BikeWeekDiscount (
    DiscountID      INT IDENTITY(1,1) PRIMARY KEY,
    DiscountName    VARCHAR(100)    NOT NULL,
    DiscountPercent DECIMAL(5,2)    NOT NULL,
    ApplicableTypes VARCHAR(200)    NOT NULL
);
GO

-- ============================================
-- Sample Data — minimum 15 rows per table
-- Uses real brand names per project instructions
-- ============================================

-- Locations (3 rows — only 3 locations exist in the merged business)
-- NOTE: The business case defines exactly 3 locations. Additional fabricated
-- locations would not represent the actual business scenario.
INSERT INTO Location (LocationName, StreetAddress, City, State, ZipCode) VALUES
('CB Bikes - Crested Butte', '221 Elk Ave', 'Crested Butte', 'CO', '81224'),
('Phil''s Fabs - Montrose', '1500 S Townsend Ave', 'Montrose', 'CO', '81401'),
('Phil''s Fabs - Lake City', '310 Silver St', 'Lake City', 'CO', '81235');

-- Shareholders (3 rows — ownership defined by the merger agreement)
-- NOTE: Exactly 3 shareholders exist per the business case.
INSERT INTO Shareholder (Name, OwnershipPercentage) VALUES
('Anne', 40.00),
('Stacey', 40.00),
('Phil', 20.00);

-- Suppliers (15 rows — real bike industry brands)
INSERT INTO Supplier (SupplierName, StreetAddress, City, State, ZipCode, ContactName, ContactPhone, ContactEmail) VALUES
('Ibis Cycles', '130 Pacheco Blvd', 'Santa Cruz', 'CA', '95060', 'Mike Torres', '831-555-0101', 'sales@ibiscycles.com'),
('Niner Bikes', '470 S Arthur Ave', 'Fort Collins', 'CO', '80521', 'Sarah Chen', '970-555-0202', 'dealers@ninerbikes.com'),
('SRAM LLC', '1000 W Fulton Market', 'Chicago', 'IL', '60607', 'Jake Miller', '312-555-0303', 'wholesale@sram.com'),
('Shimano North America', '1 Holland Dr', 'Irvine', 'CA', '92618', 'Lisa Park', '949-555-0404', 'dealers@shimano.com'),
('Maxxis Tires', '520 Cedar Bluff Rd', 'Suwanee', 'GA', '30024', 'Tom Richards', '770-555-0505', 'sales@maxxis.com'),
('Fox Racing Shox', '130 Hangar Way', 'Watsonville', 'CA', '95076', 'Amy Lin', '831-555-0606', 'dealers@ridefox.com'),
('RockShox (SRAM)', '1000 W Fulton Market', 'Chicago', 'IL', '60607', 'Ben Zhao', '312-555-0707', 'rockshox@sram.com'),
('Pearl Izumi', '2300 Central Ave', 'Boulder', 'CO', '80301', 'Grace Kim', '303-555-0808', 'wholesale@pearlizumi.com'),
('Giro Sport Design', '380 Encinal St', 'Santa Cruz', 'CA', '95060', 'Chris Davis', '831-555-0909', 'dealers@giro.com'),
('CamelBak', '2000 S McDowell Blvd', 'Petaluma', 'CA', '94954', 'Dana Ross', '707-555-1010', 'sales@camelbak.com'),
('Park Tool', '6500 W 74th St', 'Minneapolis', 'MN', '55439', 'Eric Olsen', '952-555-1111', 'orders@parktool.com'),
('Continental Tires', '1830 MacMillan Park Dr', 'Fort Mill', 'SC', '29707', 'Frank Weber', '803-555-1212', 'bike@conti-na.com'),
('WTB (Wilderness Trail Bikes)', '111 Albion St', 'San Rafael', 'CA', '94901', 'Hank Morales', '415-555-1313', 'dealers@wtb.com'),
('Chris King Precision', '1150 NW Couch St', 'Portland', 'OR', '97209', 'Ingrid Sato', '503-555-1414', 'sales@chrisking.com'),
('Ergon International', '710 S 8th St', 'Koblenz', 'CO', '80302', 'Jan Mueller', '303-555-1515', 'us@ergon-bike.com');

-- Customers (20 rows)
INSERT INTO Customer (FirstName, LastName, StreetAddress, City, State, ZipCode) VALUES
('Jake', 'Morrison', '45 Teocalli Ave', 'Crested Butte', 'CO', '81224'),
('Maria', 'Gonzalez', '112 Whiterock Ave', 'Crested Butte', 'CO', '81224'),
('Tyler', 'Brooks', '890 Belleview Ave', 'Crested Butte', 'CO', '81224'),
('Emma', 'Sullivan', '23 Gothic Rd', 'Mt Crested Butte', 'CO', '81225'),
('Ryan', 'Nakamura', '456 Main St', 'Gunnison', 'CO', '81230'),
('Olivia', 'Patel', '78 W Tomichi Ave', 'Gunnison', 'CO', '81230'),
('Liam', 'Foster', '320 S Cascade Ave', 'Montrose', 'CO', '81401'),
('Sophie', 'Kim', '55 N 1st St', 'Montrose', 'CO', '81401'),
('Marcus', 'Reeves', '201 Silver St', 'Lake City', 'CO', '81235'),
('Ava', 'Hartley', '15 Bluff St', 'Lake City', 'CO', '81235'),
('Noah', 'Benson', NULL, NULL, NULL, NULL),
('Chloe', 'Rivera', '900 Rio Grande Ave', 'Crested Butte', 'CO', '81224'),
('Ethan', 'Watts', '67 Maroon Ave', 'Crested Butte', 'CO', '81224'),
('Grace', 'Donovan', '445 Teo Rd', 'Mt Crested Butte', 'CO', '81225'),
('Daniel', 'Ortiz', '88 N Park Ave', 'Montrose', 'CO', '81401'),
('Mia', 'Tanaka', '230 Gothic Ave', 'Crested Butte', 'CO', '81224'),
('Lucas', 'Webb', '15 Butte Ave', 'Crested Butte', 'CO', '81224'),
('Harper', 'Nguyen', '402 S 3rd St', 'Montrose', 'CO', '81401'),
('Jack', 'Coleman', '77 Henson Rd', 'Lake City', 'CO', '81235'),
('Lily', 'Martinez', '123 Main St', 'Gunnison', 'CO', '81230');

-- CustomerEmail (20 rows)
INSERT INTO CustomerEmail (CustomerID, Email) VALUES
(1, 'jake.morrison@gmail.com'),
(2, 'maria.g@outlook.com'),
(2, 'mgonzalez@work.com'),
(3, 'tyler.b@gmail.com'),
(4, 'emma.sull@icloud.com'),
(5, 'r.nakamura@yahoo.com'),
(6, 'olivia.patel@gmail.com'),
(7, 'liam.foster@hotmail.com'),
(8, 'sophie.kim@gmail.com'),
(9, 'marcus.r@outlook.com'),
(10, 'ava.hartley@gmail.com'),
(12, 'chloe.r@gmail.com'),
(13, 'ethan.watts@icloud.com'),
(14, 'grace.d@outlook.com'),
(15, 'daniel.ortiz@gmail.com'),
(16, 'mia.tanaka@gmail.com'),
(17, 'lucas.webb@outlook.com'),
(18, 'harper.n@gmail.com'),
(19, 'jack.coleman@yahoo.com'),
(20, 'lily.martinez@gmail.com');

-- CustomerPhone (20 rows)
INSERT INTO CustomerPhone (CustomerID, PhoneNumber, PhoneType) VALUES
(1, '970-555-1001', 'Mobile'),
(2, '970-555-1002', 'Mobile'),
(2, '970-555-1022', 'Home'),
(3, '970-555-1003', 'Mobile'),
(4, '970-555-1004', 'Mobile'),
(5, '970-555-1005', 'Mobile'),
(6, '970-555-1006', 'Mobile'),
(7, '970-555-1007', 'Mobile'),
(8, '970-555-1008', 'Work'),
(9, '970-555-1009', 'Mobile'),
(10, '970-555-1010', 'Mobile'),
(12, '970-555-1012', 'Mobile'),
(13, '970-555-1013', 'Mobile'),
(14, '970-555-1014', 'Home'),
(15, '970-555-1015', 'Mobile'),
(16, '970-555-1016', 'Mobile'),
(17, '970-555-1017', 'Mobile'),
(18, '970-555-1018', 'Mobile'),
(19, '970-555-1019', 'Home'),
(20, '970-555-1020', 'Mobile');

-- CustomerCyclingType (22 rows — some customers ride multiple types)
INSERT INTO CustomerCyclingType (CustomerID, CyclingType) VALUES
(1, 'Enduro'), (1, 'Downhill'),
(2, 'Road'),
(3, 'XC'), (3, 'Gravel'),
(4, 'Road'),
(5, 'XC'),
(6, 'Gravel'),
(7, 'Enduro'),
(8, 'Road'),
(9, 'Downhill'),
(10, 'XC'),
(12, 'Enduro'),
(13, 'Gravel'),
(14, 'Road'),
(15, 'XC'),
(16, 'Road'), (16, 'Gravel'),
(17, 'Enduro'), (17, 'XC'),
(18, 'Road'),
(19, 'Downhill');

-- Products — Bikes (15 rows, ProductIDs 1-15)
INSERT INTO Product (ProductName, Description, MSRP, CostPrice, ProductType, SupplierID) VALUES
('Ibis Ripmo V2S', 'Full suspension enduro, 29er', 5999.00, 3600.00, 'Bike', 1),
('Ibis Ripley AF', 'Aluminum trail bike, 29er', 3499.00, 2100.00, 'Bike', 1),
('Niner RKT RDO', 'Carbon XC race bike', 6199.00, 3720.00, 'Bike', 2),
('Niner SIR 9', 'Steel hardtail, 29er', 2199.00, 1320.00, 'Bike', 2),
('Niner MCR RDO', 'Carbon full suspension gravel', 5499.00, 3300.00, 'Bike', 2),
('Ibis Exie', 'Carbon XC full suspension', 5799.00, 3480.00, 'Bike', 1),
('Ibis Mojo 4', 'Trail bike, 27.5 wheels', 4999.00, 3000.00, 'Bike', 1),
('Niner AIR 9 RDO', 'Carbon hardtail XC', 3999.00, 2400.00, 'Bike', 2),
('Niner RLT RDO', 'Carbon gravel bike', 4499.00, 2700.00, 'Bike', 2),
('Ibis Hakka MX', 'Gravel/cross carbon', 4299.00, 2580.00, 'Bike', 1),
('Niner JET 9 RDO', 'Carbon trail, 29er', 5299.00, 3180.00, 'Bike', 2),
('Ibis DV9', 'Carbon hardtail, 29er', 2999.00, 1800.00, 'Bike', 1),
('Niner WFO 9 RDO', 'Enduro, 160mm travel', 5999.00, 3600.00, 'Bike', 2),
('Ibis Ripmo V2', 'Alloy enduro, 29er', 3799.00, 2280.00, 'Bike', 1),
('Niner RIP 9 RDO', 'Carbon trail, 140mm', 5099.00, 3060.00, 'Bike', 2);

INSERT INTO Bike (ProductID, FrameMaterial, FrameSize, BuildKit, SuspensionType, Drivetrain) VALUES
(1, 'Carbon', 'L', 'SLX Build', 'Full Suspension', 'Shimano SLX'),
(2, 'Aluminum', 'M', 'Deore Build', 'Full Suspension', 'Shimano Deore'),
(3, 'Carbon', 'M', 'XX AXS Build', 'Hardtail', 'SRAM XX AXS'),
(4, 'Steel', 'L', 'SLX Build', 'Hardtail', 'Shimano SLX'),
(5, 'Carbon', 'M', 'GRX Build', 'Full Suspension', 'Shimano GRX'),
(6, 'Carbon', 'S', 'XTR Build', 'Full Suspension', 'Shimano XTR'),
(7, 'Carbon', 'L', 'XT Build', 'Full Suspension', 'Shimano XT'),
(8, 'Carbon', 'M', 'XX AXS Build', 'Hardtail', 'SRAM XX AXS'),
(9, 'Carbon', 'L', 'GRX Build', 'Rigid', 'Shimano GRX'),
(10, 'Carbon', 'M', 'GRX Build', 'Rigid', 'Shimano GRX'),
(11, 'Carbon', 'L', 'XT Build', 'Full Suspension', 'Shimano XT'),
(12, 'Carbon', 'M', 'SLX Build', 'Hardtail', 'Shimano SLX'),
(13, 'Carbon', 'XL', 'X01 AXS Build', 'Full Suspension', 'SRAM X01 AXS'),
(14, 'Aluminum', 'L', 'SLX Build', 'Full Suspension', 'Shimano SLX'),
(15, 'Carbon', 'M', 'GX AXS Build', 'Full Suspension', 'SRAM GX AXS');

-- Products — Clothing (15 rows, ProductIDs 16-30)
INSERT INTO Product (ProductName, Description, MSRP, CostPrice, ProductType, SupplierID) VALUES
('Ibis Team Jersey', 'Short sleeve cycling jersey', 79.99, 40.00, 'Clothing', 1),
('Ibis Trail Short', 'MTB baggy shorts', 89.99, 45.00, 'Clothing', 1),
('Niner Logo Tee', 'Cotton blend casual tee', 34.99, 17.50, 'Clothing', 2),
('SRAM Mechanic Gloves', 'Full finger work gloves', 29.99, 15.00, 'Clothing', 3),
('Shimano Winter Jacket', 'Insulated cycling jacket', 149.99, 75.00, 'Clothing', 4),
('Pearl Izumi Quest Jersey', 'Road cycling jersey', 59.99, 30.00, 'Clothing', 8),
('Pearl Izumi Summit Short', 'MTB short with liner', 79.99, 40.00, 'Clothing', 8),
('Giro DND Gloves', 'Trail riding gloves', 34.99, 17.50, 'Clothing', 9),
('Pearl Izumi Pro Bib', 'Road cycling bib shorts', 129.99, 65.00, 'Clothing', 8),
('Ibis Wool Beanie', 'Merino wool winter beanie', 24.99, 12.50, 'Clothing', 1),
('Giro Chrono Sport Jersey', 'Road jersey, full zip', 69.99, 35.00, 'Clothing', 9),
('Pearl Izumi AmFIB Tight', 'Winter cycling tights', 109.99, 55.00, 'Clothing', 8),
('Niner Trucker Hat', 'Snapback trucker cap', 29.99, 15.00, 'Clothing', 2),
('SRAM Tech Tee', 'Moisture wicking tee', 39.99, 20.00, 'Clothing', 3),
('Fox Ranger Short', 'MTB trail shorts', 69.99, 35.00, 'Clothing', 6);

INSERT INTO Clothing (ProductID, Size) VALUES
(16, 'L'), (17, 'M'), (18, 'XL'), (19, 'L'), (20, 'M'),
(21, 'M'), (22, 'L'), (23, 'M'), (24, 'S'), (25, 'M'),
(26, 'L'), (27, 'M'), (28, 'L'), (29, 'M'), (30, 'L');

-- Products — Parts (15 rows, ProductIDs 31-45)
INSERT INTO Product (ProductName, Description, MSRP, CostPrice, ProductType, SupplierID) VALUES
('SRAM GX Eagle Derailleur', '12-speed rear derailleur', 149.00, 89.40, 'Part', 3),
('Shimano XT Brake Set', 'Hydraulic disc brakes, pair', 219.99, 132.00, 'Part', 4),
('Maxxis Minion DHF', '29x2.5 EXO+ tire', 74.99, 37.50, 'Part', 5),
('Maxxis Aggressor', '29x2.3 EXO tire', 64.99, 32.50, 'Part', 5),
('SRAM GX Eagle Chain', '12-speed chain', 34.99, 21.00, 'Part', 3),
('Fox 36 Performance Fork', '29er, 150mm travel', 899.00, 540.00, 'Part', 6),
('RockShox Pike Ultimate', '29er, 140mm fork', 949.00, 570.00, 'Part', 7),
('Shimano XT Cassette', '12-speed, 10-51T', 99.99, 60.00, 'Part', 4),
('Maxxis Dissector', '29x2.4 EXO+ tire', 74.99, 37.50, 'Part', 5),
('SRAM Code RSC Brakes', '4-piston hydraulic, pair', 339.00, 203.40, 'Part', 3),
('Chris King Headset', 'InSet 7, tapered', 159.00, 95.40, 'Part', 14),
('WTB Volt Saddle', 'Cromoly rails, medium', 49.99, 25.00, 'Part', 13),
('Ergon GA3 Grips', 'Lock-on ergonomic grips', 34.99, 17.50, 'Part', 15),
('Continental Trail King', '29x2.4 ProTection tire', 69.99, 35.00, 'Part', 12),
('Park Tool PCS-10.3 Stand', 'Home mechanic repair stand', 219.99, 132.00, 'Part', 11);

INSERT INTO Part (ProductID, Weight) VALUES
(31, 312.00), (32, 450.00), (33, 890.00), (34, 820.00), (35, 252.00),
(36, 1950.00), (37, 1850.00), (38, 370.00), (39, 870.00), (40, 380.00),
(41, 145.00), (42, 255.00), (43, 110.00), (44, 860.00), (45, 3200.00);

-- Products — Services (15 rows, ProductIDs 46-60)
INSERT INTO Product (ProductName, Description, MSRP, CostPrice, ProductType, SupplierID) VALUES
('Basic Tune-Up', 'Shift/brake adjust, lube chain', 79.99, 10.00, 'Service', NULL),
('Full Overhaul', 'Complete disassembly, clean, rebuild', 249.99, 40.00, 'Service', NULL),
('Brake Bleed', 'Hydraulic brake bleed, both wheels', 49.99, 5.00, 'Service', NULL),
('Wheel True', 'Spoke tension and true', 34.99, 2.00, 'Service', NULL),
('Suspension Service', 'Fork and shock service', 189.99, 25.00, 'Service', NULL),
('Flat Tire Repair', 'Tube replacement and tire reseat', 19.99, 3.00, 'Service', NULL),
('Drivetrain Install', 'Full drivetrain swap and adjust', 129.99, 15.00, 'Service', NULL),
('Headset Service', 'Remove, clean, regrease, reinstall', 39.99, 5.00, 'Service', NULL),
('Wheel Build', 'Lace, tension, and true new wheel', 89.99, 10.00, 'Service', NULL),
('Tubeless Setup', 'Rim tape, valve, sealant, seat', 44.99, 8.00, 'Service', NULL),
('Cable Replacement', 'Shift and brake cable/housing swap', 59.99, 12.00, 'Service', NULL),
('Bottom Bracket Service', 'Remove, clean, regrease or replace', 49.99, 5.00, 'Service', NULL),
('Custom Bike Build', 'Full custom build from frame up', 399.99, 50.00, 'Service', NULL),
('Bike Fitting', 'Professional bike fit session', 149.99, 10.00, 'Service', NULL),
('Safety Inspection', 'Full safety check, all systems', 29.99, 2.00, 'Service', NULL);

INSERT INTO Service (ProductID) VALUES
(46),(47),(48),(49),(50),(51),(52),(53),(54),(55),(56),(57),(58),(59),(60);

-- ServicePart — which parts services commonly use (15 rows)
INSERT INTO ServicePart (ServiceID, PartID, QuantityUsed) VALUES
(46, 35, 1),    -- Basic Tune-Up uses a chain
(47, 31, 1),    -- Full Overhaul uses derailleur
(47, 32, 1),    -- Full Overhaul uses brake set
(47, 35, 1),    -- Full Overhaul uses chain
(47, 38, 1),    -- Full Overhaul uses cassette
(48, 32, 1),    -- Brake Bleed uses brake set
(50, 36, 1),    -- Suspension Service uses fork
(52, 31, 1),    -- Drivetrain Install uses derailleur
(52, 35, 1),    -- Drivetrain Install uses chain
(52, 38, 1),    -- Drivetrain Install uses cassette
(53, 41, 1),    -- Headset Service uses headset
(54, 33, 2),    -- Wheel Build uses 2 tires
(55, 33, 2),    -- Tubeless Setup uses 2 tires
(56, 35, 1),    -- Cable Replacement uses chain (cable)
(58, 31, 1);    -- Custom Build uses derailleur

-- Employees (15 rows — retail + fabrication across 3 locations)
INSERT INTO Employee (FirstName, LastName, StreetAddress, City, State, ZipCode, EmployeeType, CommissionRate, Salary, LocationID) VALUES
('Stacey', 'Owner', '100 Elk Ave', 'Crested Butte', 'CO', '81224', 'Retail', 0.10, NULL, 1),
('Anne', 'Owner', '102 Elk Ave', 'Crested Butte', 'CO', '81224', 'Retail', 0.10, NULL, 1),
('Bob', 'Wrench', '55 Butte Ave', 'Crested Butte', 'CO', '81224', 'Retail', 0.10, NULL, 1),
('Phil', 'Builder', '200 Main St', 'Montrose', 'CO', '81401', 'Retail', 0.10, NULL, 2),
('Carlos', 'Mendez', '89 S 2nd St', 'Montrose', 'CO', '81401', 'Fabrication', NULL, 55000.00, 2),
('Dana', 'Kim', '321 Cascade Dr', 'Montrose', 'CO', '81401', 'Fabrication', NULL, 62000.00, 2),
('Eli', 'Trujillo', '45 Oak St', 'Lake City', 'CO', '81235', 'Retail', 0.10, NULL, 3),
('Fiona', 'Hart', '78 Aspen Ln', 'Montrose', 'CO', '81401', 'Fabrication', NULL, 58000.00, 2),
('Greg', 'Patterson', '112 Elk Ave', 'Crested Butte', 'CO', '81224', 'Retail', 0.10, NULL, 1),
('Hannah', 'Voss', '88 Silver St', 'Lake City', 'CO', '81235', 'Retail', 0.10, NULL, 3),
('Ivan', 'Reyes', '90 S Townsend Ave', 'Montrose', 'CO', '81401', 'Retail', 0.10, NULL, 2),
('Jenna', 'Liu', '55 N 3rd St', 'Montrose', 'CO', '81401', 'Fabrication', NULL, 60000.00, 2),
('Kyle', 'Norton', '230 Whiterock Ave', 'Crested Butte', 'CO', '81224', 'Retail', 0.10, NULL, 1),
('Leah', 'Garcia', '14 Butte Ave', 'Crested Butte', 'CO', '81224', 'Retail', 0.10, NULL, 1),
('Mike', 'Tanaka', '67 Henson Rd', 'Lake City', 'CO', '81235', 'Retail', 0.10, NULL, 3);

-- EmployeeSkill (15 rows — fab employees: Carlos(5), Dana(6), Fiona(8), Jenna(12))
INSERT INTO EmployeeSkill (EmployeeID, Skill) VALUES
(5, 'Fabrication'),
(5, 'Engineering'),
(5, 'Welding'),
(6, 'Design'),
(6, 'Engineering'),
(6, 'Fabrication'),
(6, 'CAD'),
(8, 'Design'),
(8, 'Fabrication'),
(8, 'Painting'),
(12, 'Engineering'),
(12, 'Fabrication'),
(12, 'Welding'),
(12, 'CAD'),
(12, 'Design');

-- Sales (25 rows)
INSERT INTO Sale (CustomerID, EmployeeID, LocationID, SaleDate) VALUES
(1, 1, 1, '2026-01-15'),     -- 1
(2, 2, 1, '2026-01-18'),     -- 2
(3, 3, 1, '2026-01-22'),     -- 3
(4, 1, 1, '2026-02-03'),     -- 4
(5, 2, 1, '2026-02-10'),     -- 5
(6, 3, 1, '2026-02-14'),     -- 6
(7, 4, 2, '2026-02-20'),     -- 7
(8, 7, 3, '2026-02-25'),     -- 8
(9, 4, 2, '2026-03-01'),     -- 9
(10, 7, 3, '2026-03-05'),    -- 10
(1, 1, 1, '2026-03-10'),     -- 11
(12, 2, 1, '2026-03-12'),    -- 12
(13, 3, 1, '2026-03-15'),    -- 13
(14, 1, 1, '2026-03-18'),    -- 14
(15, 4, 2, '2026-03-22'),    -- 15
(16, 9, 1, '2026-03-25'),    -- 16
(17, 13, 1, '2026-03-28'),   -- 17
(18, 11, 2, '2026-04-01'),   -- 18
(19, 10, 3, '2026-04-03'),   -- 19
(20, 14, 1, '2026-04-05'),   -- 20
(3, 3, 1, '2026-04-07'),     -- 21
(7, 11, 2, '2026-04-08'),    -- 22
(9, 15, 3, '2026-04-10'),    -- 23
(16, 1, 1, '2026-04-12'),    -- 24
(5, 2, 1, '2026-04-14');     -- 25

-- SaleLineItem (30 rows — some sales have multiple items)
INSERT INTO SaleLineItem (SaleID, ProductID, Quantity, UnitPrice) VALUES
(1, 1, 1, 5999.00),      -- Jake: Ibis Ripmo
(1, 33, 2, 74.99),        -- Jake: 2 Minion tires
(2, 18, 1, 34.99),        -- Maria: Niner tee
(3, 3, 1, 6199.00),       -- Tyler: Niner RKT
(3, 35, 1, 34.99),        -- Tyler: chain
(4, 20, 1, 149.99),       -- Emma: winter jacket
(5, 5, 1, 5499.00),       -- Ryan: Niner MCR
(6, 16, 1, 79.99),        -- Olivia: jersey
(6, 17, 1, 89.99),        -- Olivia: trail shorts
(7, 2, 1, 3499.00),       -- Liam: Ripley AF
(7, 31, 1, 149.00),       -- Liam: derailleur
(8, 4, 1, 2199.00),       -- Sophie: SIR 9
(9, 46, 1, 79.99),        -- Marcus: tune-up (service)
(10, 34, 2, 64.99),       -- Ava: 2 Aggressor tires
(11, 47, 1, 249.99),      -- Jake: overhaul (service)
(12, 19, 2, 29.99),       -- Chloe: 2x gloves
(13, 33, 1, 74.99),       -- Ethan: tire
(13, 34, 1, 64.99),       -- Ethan: tire
(14, 32, 1, 219.99),      -- Grace: brake set
(15, 50, 1, 189.99),      -- Daniel: suspension svc
(16, 6, 1, 5799.00),      -- Mia: Ibis Exie
(17, 8, 1, 3999.00),      -- Lucas: AIR 9 RDO
(17, 43, 1, 34.99),       -- Lucas: grips
(18, 21, 1, 59.99),       -- Harper: PI jersey
(18, 22, 1, 79.99),       -- Harper: PI shorts
(19, 49, 1, 34.99),       -- Jack: wheel true (svc)
(20, 10, 1, 4299.00),     -- Lily: Hakka MX
(21, 48, 1, 49.99),       -- Tyler: brake bleed (svc)
(22, 37, 1, 949.00),      -- Liam: Pike fork
(23, 50, 1, 189.99),      -- Marcus: suspension svc
-- Service line items (services sold must appear in SaleLineItem for revenue tracking)
(8, 46, 1, 79.99),        -- Sophie: tune-up
(10, 60, 1, 29.99),       -- Ava: safety inspection
(16, 46, 1, 79.99),       -- Mia: tune-up (walk-in after bike purchase)
(17, 46, 1, 79.99),       -- Lucas: tune-up (after purchase)
(18, 51, 1, 19.99),       -- Harper: flat tire repair
(20, 60, 1, 29.99),       -- Lily: safety inspection
(22, 52, 1, 129.99),      -- Liam: drivetrain install
(24, 55, 1, 44.99),       -- Mia: tubeless setup
(25, 46, 1, 79.99);       -- Ryan: tune-up

-- ServiceRecord (15 rows)
INSERT INTO ServiceRecord (SaleID, ServiceProductID, EmployeeID, ServiceDate, ServicePrice) VALUES
(9, 46, 4, '2026-03-01', 79.99),       -- Marcus tune-up by Phil
(11, 47, 3, '2026-03-11', 249.99),     -- Jake overhaul by Bob
(15, 50, 4, '2026-03-22', 189.99),     -- Daniel suspension svc by Phil
(19, 49, 10, '2026-04-03', 34.99),     -- Jack wheel true by Hannah
(21, 48, 3, '2026-04-07', 49.99),      -- Tyler brake bleed by Bob
(23, 50, 15, '2026-04-10', 189.99),    -- Marcus suspension svc by Mike
(16, 46, 9, '2026-03-26', 79.99),      -- Mia tune-up by Greg (walk-in after bike purchase)
(20, 60, 14, '2026-04-06', 29.99),     -- Lily safety inspection by Leah
(24, 55, 1, '2026-04-13', 44.99),      -- Mia tubeless setup by Stacey
(25, 46, 2, '2026-04-14', 79.99),      -- Ryan tune-up by Anne
(17, 46, 13, '2026-03-29', 79.99),     -- Lucas tune-up by Kyle (after purchase)
(18, 51, 11, '2026-04-02', 19.99),     -- Harper flat tire by Ivan
(22, 52, 4, '2026-04-09', 129.99),     -- Liam drivetrain install by Phil
(10, 60, 7, '2026-03-06', 29.99),      -- Ava safety inspection by Eli
(8, 46, 7, '2026-02-26', 79.99);       -- Sophie tune-up by Eli (day after purchase)

-- ============================================
-- Addendum 2: Junior Bike Week 2027 Data
-- ============================================

-- Guardians (16 rows)
INSERT INTO Guardian (FirstName, LastName, StreetAddress, City, State, ZipCode, CCNumber, CCExpiry, WaiverSigned) VALUES
('Jake', 'Morrison', '45 Teocalli Ave', 'Crested Butte', 'CO', '81224', '4111222233334444', '08/2028', 1),
('Maria', 'Gonzalez', '112 Whiterock Ave', 'Crested Butte', 'CO', '81224', '5222333344445555', '11/2027', 1),
('Tyler', 'Brooks', '890 Belleview Ave', 'Crested Butte', 'CO', '81224', '4333444455556666', '03/2029', 1),
('Ryan', 'Nakamura', '456 Main St', 'Gunnison', 'CO', '81230', '5444555566667777', '06/2028', 1),
('Liam', 'Foster', '320 S Cascade Ave', 'Montrose', 'CO', '81401', '4555666677778888', '12/2027', 1),
('Sophie', 'Kim', '55 N 1st St', 'Montrose', 'CO', '81401', '5666777788889999', '09/2028', 1),
('Marcus', 'Reeves', '201 Silver St', 'Lake City', 'CO', '81235', '4777888899990000', '01/2029', 1),
('Chloe', 'Rivera', '900 Rio Grande Ave', 'Crested Butte', 'CO', '81224', '5888999900001111', '04/2028', 1),
('Daniel', 'Ortiz', '88 N Park Ave', 'Montrose', 'CO', '81401', '4999000011112222', '07/2029', 1),
('Mia', 'Tanaka', '230 Gothic Ave', 'Crested Butte', 'CO', '81224', '5000111122223333', '10/2027', 1),
('Robert', 'Chen', '150 Elk Ave', 'Crested Butte', 'CO', '81224', '4111333355557777', '02/2028', 1),
('Amanda', 'Ruiz', '67 Pine St', 'Gunnison', 'CO', '81230', '5222444466668888', '05/2029', 1),
('Kevin', 'Walsh', '430 N 2nd St', 'Montrose', 'CO', '81401', '4333555577779999', '08/2028', 1),
('Lisa', 'Patel', '78 W Tomichi Ave', 'Gunnison', 'CO', '81230', '5444666688880000', '11/2027', 1),
('Brian', 'Hoffman', '22 Aspen Ln', 'Lake City', 'CO', '81235', '4555777799991111', '03/2029', 1),
('Sandra', 'Nguyen', '95 Silver St', 'Lake City', 'CO', '81235', '5666888800002222', '06/2028', 1);

-- Participants (18 rows — youth ages 6-17, linked to guardians)
INSERT INTO Participant (FirstName, LastName, Age, StreetAddress, City, State, ZipCode, GuardianID, WaiverSigned) VALUES
('Ethan', 'Morrison', 14, '45 Teocalli Ave', 'Crested Butte', 'CO', '81224', 1, 1),
('Lily', 'Morrison', 11, '45 Teocalli Ave', 'Crested Butte', 'CO', '81224', 1, 1),
('Sofia', 'Gonzalez', 16, '112 Whiterock Ave', 'Crested Butte', 'CO', '81224', 2, 1),
('Mason', 'Brooks', 13, '890 Belleview Ave', 'Crested Butte', 'CO', '81224', 3, 1),
('Aiden', 'Nakamura', 10, '456 Main St', 'Gunnison', 'CO', '81230', 4, 1),
('Zoe', 'Nakamura', 7, '456 Main St', 'Gunnison', 'CO', '81230', 4, 1),
('Owen', 'Foster', 15, '320 S Cascade Ave', 'Montrose', 'CO', '81401', 5, 1),
('Ella', 'Kim', 12, '55 N 1st St', 'Montrose', 'CO', '81401', 6, 1),
('Noah', 'Reeves', 9, '201 Silver St', 'Lake City', 'CO', '81235', 7, 1),
('Ava', 'Rivera', 17, '900 Rio Grande Ave', 'Crested Butte', 'CO', '81224', 8, 1),
('Logan', 'Ortiz', 8, '88 N Park Ave', 'Montrose', 'CO', '81401', 9, 1),
('Mila', 'Tanaka', 6, '230 Gothic Ave', 'Crested Butte', 'CO', '81224', 10, 1),
('Lucas', 'Chen', 14, '150 Elk Ave', 'Crested Butte', 'CO', '81224', 11, 1),
('Harper', 'Ruiz', 11, '67 Pine St', 'Gunnison', 'CO', '81230', 12, 1),
('Jack', 'Walsh', 16, '430 N 2nd St', 'Montrose', 'CO', '81401', 13, 1),
('Emma', 'Patel', 13, '78 W Tomichi Ave', 'Gunnison', 'CO', '81230', 14, 1),
('Dylan', 'Hoffman', 10, '22 Aspen Ln', 'Lake City', 'CO', '81235', 15, 1),
('Chloe', 'Nguyen', 8, '95 Silver St', 'Lake City', 'CO', '81235', 16, 1);

-- Events (16 rows — mix of race and recreational across 3 locations, various age brackets)
INSERT INTO Event (EventName, EventDate, EventTime, LocationID, RegistrationFee, AgeGroupBracket) VALUES
('Junior Downhill Sprint', '2027-06-14', '09:00', 1, 25.00, '15-17'),
('Kids XC Fun Race', '2027-06-14', '10:30', 1, 15.00, '9-11'),
('Short Track Challenge', '2027-06-14', '13:00', 1, 20.00, '12-14'),
('Tiny Riders XC', '2027-06-15', '09:00', 2, 10.00, '6-8'),
('Teen Downhill Championship', '2027-06-15', '11:00', 2, 30.00, '15-17'),
('Trail Skills Clinic', '2027-06-14', '08:30', 1, 10.00, '6-8'),
('Bike Safety Workshop', '2027-06-14', '14:00', 2, 0.00, '6-8'),
('Mountain Bike Obstacle Course', '2027-06-15', '09:30', 3, 12.00, '9-11'),
('Junior Bike Rodeo', '2027-06-15', '13:00', 3, 8.00, '6-8'),
('Intermediate Trail Ride', '2027-06-15', '10:00', 1, 15.00, '12-14'),
('Short Track Sprint', '2027-06-16', '09:00', 2, 20.00, '9-11'),
('Downhill Time Trial', '2027-06-16', '11:00', 3, 25.00, '12-14'),
('Bike Maintenance 101', '2027-06-16', '14:00', 1, 5.00, '12-14'),
('Family Fun Ride', '2027-06-16', '08:00', 1, 5.00, '6-8'),
('XC Endurance Race', '2027-06-16', '10:00', 2, 25.00, '15-17'),
('Awards Ceremony & Cookout', '2027-06-16', '16:00', 1, 0.00, '6-8');

-- RaceEvent subtypes (8 rows — events 1-5, 11, 12, 15 are races)
INSERT INTO RaceEvent (EventID, RaceType) VALUES
(1, 'Downhill'),
(2, 'XC'),
(3, 'Short Track'),
(4, 'XC'),
(5, 'Downhill'),
(11, 'Short Track'),
(12, 'Downhill'),
(15, 'XC');

-- RecreationalEvent subtypes (8 rows — events 6-10, 13, 14, 16 are recreational)
INSERT INTO RecreationalEvent (EventID, Description) VALUES
(6, 'Hands-on clinic teaching trail riding basics including balance, braking, and cornering for beginners'),
(7, 'Interactive workshop covering helmet fitting, hand signals, road rules, and basic bike safety checks'),
(8, 'Timed obstacle course with log crossings, rock gardens, and balance beams on a closed trail'),
(9, 'Rodeo-style skills competition including slow race, figure-8, and cone weave challenges'),
(10, 'Guided group ride on intermediate singletrack with trail etiquette instruction'),
(13, 'Workshop teaching basic bike maintenance: flat repair, chain lube, brake adjustment, and pre-ride checks'),
(14, 'Casual group ride on a flat paved path open to all ages with parent participation encouraged'),
(16, 'End-of-event celebration with awards for all age brackets, food, and prize drawings');

-- EventRegistration (20 rows)
INSERT INTO EventRegistration (ParticipantID, EventID, RegistrationDate) VALUES
(1, 3, '2027-05-20'),     -- Ethan (14) -> Short Track Challenge 12-14
(2, 2, '2027-05-21'),     -- Lily (11) -> Kids XC Fun Race 9-11
(3, 1, '2027-06-01'),     -- Sofia (16) -> Junior Downhill Sprint 15-17
(4, 3, '2027-05-25'),     -- Mason (13) -> Short Track Challenge 12-14
(5, 2, '2027-05-28'),     -- Aiden (10) -> Kids XC Fun Race 9-11
(6, 7, '2027-06-02'),     -- Zoe (7) -> Bike Safety Workshop 6-8
(7, 5, '2027-05-30'),     -- Owen (15) -> Teen Downhill Championship 15-17
(8, 8, '2027-06-03'),     -- Ella (12) -> Mountain Bike Obstacle Course 9-11
(9, 8, '2027-06-01'),     -- Noah (9) -> Mountain Bike Obstacle Course 9-11
(10, 1, '2027-05-22'),    -- Ava (17) -> Junior Downhill Sprint 15-17
(11, 9, '2027-06-05'),    -- Logan (8) -> Junior Bike Rodeo 6-8
(12, 6, '2027-06-04'),    -- Mila (6) -> Trail Skills Clinic 6-8
(13, 12, '2027-06-01'),   -- Lucas (14) -> Downhill Time Trial 12-14
(14, 11, '2027-05-29'),   -- Harper (11) -> Short Track Sprint 9-11
(15, 15, '2027-05-27'),   -- Jack (16) -> XC Endurance Race 15-17
(16, 10, '2027-06-02'),   -- Emma (13) -> Intermediate Trail Ride 12-14
(17, 4, '2027-06-06'),    -- Dylan (10) -> Tiny Riders XC 6-8
(18, 9, '2027-06-05'),    -- Chloe N (8) -> Junior Bike Rodeo 6-8
(3, 15, '2027-06-01'),    -- Sofia also in XC Endurance Race
(7, 15, '2027-05-30'),    -- Owen also in XC Endurance Race
(11, 4, '2027-06-05'),    -- Logan also in Tiny Riders XC
(12, 4, '2027-06-04'),    -- Mila also in Tiny Riders XC
(16, 12, '2027-06-02');   -- Emma also in Downhill Time Trial

-- RaceResult (16 rows — only for race events)
INSERT INTO RaceResult (ParticipantID, EventID, FinishTime, Placement) VALUES
(1, 3, '00:18:32', 2),     -- Ethan in Short Track Challenge
(4, 3, '00:17:45', 1),     -- Mason in Short Track Challenge
(2, 2, '00:25:10', 2),     -- Lily in Kids XC Fun Race
(5, 2, '00:23:48', 1),     -- Aiden in Kids XC Fun Race
(3, 1, '00:04:22', 1),     -- Sofia in Junior Downhill Sprint
(10, 1, '00:04:35', 2),    -- Ava in Junior Downhill Sprint
(7, 5, '00:03:58', 1),     -- Owen in Teen Downhill Championship
(17, 4, '00:15:30', 1),    -- Dylan in Tiny Riders XC
(14, 11, '00:12:15', 1),   -- Harper in Short Track Sprint
(13, 12, '00:05:10', 1),   -- Lucas in Downhill Time Trial
(3, 15, '00:45:22', 2),    -- Sofia in XC Endurance Race
(15, 15, '00:42:18', 1),   -- Jack in XC Endurance Race
(7, 15, '00:44:05', 3),    -- Owen in XC Endurance Race (3rd in 15-17 bracket, registered above)
(16, 12, '00:05:42', 2),   -- Emma in Downhill Time Trial (registered via event 10 same age bracket)
(11, 4, '00:16:20', 2),    -- Logan in Tiny Riders XC
(12, 4, '00:18:05', 3);    -- Mila in Tiny Riders XC

-- BikeWeekDiscount (2 rows)
INSERT INTO BikeWeekDiscount (DiscountName, DiscountPercent, ApplicableTypes) VALUES
('Bike Week Parts/Accessories/Clothing Discount', 10.00, 'Part, Clothing'),
('Bike Week Bicycle Discount', 15.00, 'Bike');
GO
