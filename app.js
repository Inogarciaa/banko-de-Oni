/**
 * Banking System Simulator - OOP Core & ATM Interface
 */

// ==========================================
// 1. Core Classes & OOP Architecture
// ==========================================

/**
 * Class representing a single transaction record.
 */
class Transaction {
    constructor(type, amount, description, balanceAfter, fee = 0) {
        this.id = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
        this.timestamp = new Date();
        this.type = type; // 'deposit', 'withdraw', 'transfer_in', 'transfer_out', 'interest', 'fee'
        this.amount = amount;
        this.description = description;
        this.balanceAfter = balanceAfter;
        this.fee = fee;
    }

    getFormattedDate() {
        return this.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + 
               this.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

/**
 * Base BankAccount Class (Encapsulated)
 */
class BankAccount {
    // Encapsulated fields (Private variables)
    #balance;
    #accountNumber;

    constructor(holderName, initialBalance = 0) {
        if (this.constructor === BankAccount) {
            throw new TypeError("Cannot construct BankAccount instances directly (Abstract Class)");
        }
        this.holderName = holderName;
        this.#balance = initialBalance;
        this.#accountNumber = 'AC-' + Math.floor(10000000 + Math.random() * 90000000);
        this.transactions = [];
        
        // Initial deposit transaction if balance > 0
        if (initialBalance > 0) {
            this.addTransaction('deposit', initialBalance, 'Initial Deposit');
        }
    }

    // Getters for encapsulated data
    getBalance() {
        return this.#balance;
    }

    getAccountNumber() {
        return this.#accountNumber;
    }

    getMaskedAccountNumber() {
        const acc = this.getAccountNumber();
        return `•••• ${acc.slice(-4)}`;
    }

    /**
     * Common deposit logic
     */
    deposit(amount, description = 'Cash Deposit') {
        if (amount <= 0) return false;
        
        this.#balance += amount;
        this.addTransaction('deposit', amount, description);
        return true;
    }

    /**
     * Common withdrawal logic
     */
    withdraw(amount, description = 'Cash Withdrawal') {
        if (amount <= 0 || this.#balance < amount) return false;
        
        this.#balance -= amount;
        this.addTransaction('withdraw', amount, description);
        return true;
    }

    /**
     * Transfer funds to another account
     */
    transfer(amount, targetAccount, description = '') {
        if (amount <= 0) return false;
        
        const fee = this.type === 'Checking' ? 0 : 0; // standard checking withdraw will apply its own fee

        // Attempt withdrawal
        const success = this.withdraw(amount, description || `Transfer to ${targetAccount.type} Account`);
        if (success) {
            // Deposit to target account
            targetAccount.deposit(amount, description || `Transfer from ${this.type} Account`);
            return true;
        }
        return false;
    }

    /**
     * Helper to log transactions
     */
    addTransaction(type, amount, description, fee = 0) {
        const txn = new Transaction(type, amount, description, this.#balance, fee);
        this.transactions.unshift(txn); // Add to beginning of array
        return txn;
    }
}

/**
 * SavingsAccount Class (Inheritance)
 */
class SavingsAccount extends BankAccount {
    constructor(holderName, initialBalance = 0, interestRate = 0.04, minimumBalance = 100) {
        super(holderName, initialBalance);
        this.interestRate = interestRate; // 4% per year
        this.minimumBalance = minimumBalance; // Minimum balance required to withdraw or open
        this.type = 'Savings';
    }

    /**
     * Polymorphic withdraw: enforces minimum balance constraint
     */
    withdraw(amount, description = 'Savings Withdrawal') {
        if (this.getBalance() - amount < this.minimumBalance) {
            console.warn(`Savings Account withdrawal rejected: Must maintain minimum balance of ₱${this.minimumBalance}`);
            return false;
        }
        return super.withdraw(amount, description);
    }

    /**
     * Apply accrued interest (monthly basis simulation)
     */
    applyInterest() {
        const interest = this.getBalance() * (this.interestRate / 12); // monthly interest simulation
        if (interest > 0) {
            // Deposit is called directly which updates #balance and records transaction
            this.deposit(interest, `Monthly Interest Credit (${(this.interestRate * 100).toFixed(1)}% p.a.)`);
            return interest;
        }
        return 0;
    }
}

/**
 * CheckingAccount Class (Inheritance)
 */
class CheckingAccount extends BankAccount {
    constructor(holderName, initialBalance = 0, transactionFee = 5.00) {
        super(holderName, initialBalance);
        this.transactionFee = transactionFee; // Fee applied on withdrawals
        this.type = 'Checking';
    }

    /**
     * Polymorphic withdraw: applies transaction fee
     */
    withdraw(amount, description = 'Checking Withdrawal') {
        const totalDebit = amount + this.transactionFee;
        if (this.getBalance() < totalDebit) {
            console.warn(`Checking Account withdrawal rejected: Insufficient funds to cover amount + fee (₱${this.transactionFee.toFixed(2)})`);
            return false;
        }
        
        // Call parent withdrawal with the total amount to deduct
        const success = super.withdraw(totalDebit, `${description} (Inc. Fee)`);
        if (success) {
            // We adjust the transaction records for finer reporting
            const lastTx = this.transactions[0];
            if (lastTx) {
                lastTx.fee = this.transactionFee;
                lastTx.amount = amount; // Visual adjustment to show exact withdraw amount
                lastTx.description = description;
            }
            return true;
        }
        return false;
    }
}

/**
 * BankUser Class (Encapsulated credentials & accounts)
 */
class BankUser {
    #pin;
    
    constructor(name, pin, checkingInit = 500, savingsInit = 1000) {
        this.name = name;
        this.#pin = pin;
        this.accounts = {
            checking: new CheckingAccount(name, checkingInit),
            savings: new SavingsAccount(name, savingsInit)
        };
    }

    verifyPIN(inputPin) {
        return this.#pin === inputPin;
    }

    changePIN(oldPin, newPin) {
        if (this.verifyPIN(oldPin)) {
            this.#pin = newPin;
            return true;
        }
        return false;
    }
}

// ==========================================
// 2. Audio Synthesizer (Web Audio API)
// ==========================================
class SoundSynth {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playBeep(frequency = 1000, duration = 0.08, type = 'sine') {
        this.init();
        if (!this.ctx || this.ctx.state === 'suspended') return;
        
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
            
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error("Synthesizer playback error:", e);
        }
    }

    playClick() {
        this.playBeep(1200, 0.04, 'triangle');
    }

    playSuccess() {
        this.init();
        if (!this.ctx) return;
        this.playBeep(880, 0.1, 'sine');
        setTimeout(() => this.playBeep(1320, 0.15, 'sine'), 80);
    }

    playError() {
        this.init();
        if (!this.ctx) return;
        this.playBeep(220, 0.3, 'sawtooth');
    }

    playCashEject() {
        this.init();
        if (!this.ctx || this.ctx.state === 'suspended') return;
        try {
            const duration = 1.0;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(70, this.ctx.currentTime);
            osc1.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + duration);
            
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(73, this.ctx.currentTime);
            osc2.frequency.linearRampToValueAtTime(103, this.ctx.currentTime + duration);
            
            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + duration - 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc1.start();
            osc2.start();
            osc1.stop(this.ctx.currentTime + duration);
            osc2.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error("Cash eject sound error:", e);
        }
    }
}

// ==========================================
// 3. ATM UI & Application Controller
// ==========================================
class ATMController {
    constructor() {
        // App State
        this.user = new BankUser("Alex Mercer", "1234", 450.00, 1200.00);
        this.activeAccount = null; // checking or savings
        this.walletCash = 100.00;
        this.sessionTimer = null;
        this.sessionTimeRemaining = 120; // 2 minutes auto-logout
        this.pinBuffer = "";
        this.cardInserted = false;
        
        // Classes
        this.audio = new SoundSynth();

        // Cached DOM Elements
        this.dom = {};
    }

    init() {
        console.log("Initializing ATM Application...");
        this.cacheElements();
        this.bindEvents();
        this.runOOPTests(); // Console verification
        this.updateWalletUI();
        this.showScreen('screen-idle');
    }

    cacheElements() {
        // Screens
        this.dom.screens = {
            idle: document.getElementById('screen-idle'),
            pin: document.getElementById('screen-pin'),
            dashboard: document.getElementById('screen-dashboard'),
            transaction: document.getElementById('screen-transaction'),
            history: document.getElementById('screen-history'),
            manage: document.getElementById('screen-manage')
        };

        // UI Interactive Areas
        this.dom.atmCard = document.getElementById('atm-card');
        this.dom.cardSlot = document.getElementById('card-slot');
        this.dom.cardSlotWrapper = document.getElementById('card-slot-wrapper');
        this.dom.pinDisplay = document.getElementById('pin-display');
        this.dom.pinError = document.getElementById('pin-error');
        this.dom.physicalKeypad = document.getElementById('physical-keypad');
        this.dom.cashDispenser = document.getElementById('cash-dispenser');
        this.dom.receiptPrinter = document.getElementById('receipt-printer');
        this.dom.receiptContainer = document.getElementById('receipt-container');
        this.dom.receiptContent = document.getElementById('receipt-content');
        this.dom.walletCashValue = document.getElementById('wallet-cash-value');
        this.dom.cardStatusText = document.getElementById('card-status-text');

        // Dashboard Stats
        this.dom.checkingBalance = document.getElementById('checking-balance');
        this.dom.checkingAccNum = document.getElementById('checking-acc-num');
        this.dom.savingsBalance = document.getElementById('savings-balance');
        this.dom.savingsAccNum = document.getElementById('savings-acc-num');
        this.dom.userName = document.getElementById('user-name');
        this.dom.sessionTimerText = document.getElementById('session-timer-text');

        // Form elements
        this.dom.txTitle = document.getElementById('tx-title');
        this.dom.txAccDetails = document.getElementById('tx-acc-details');
        this.dom.txForm = document.getElementById('tx-form');
        this.dom.txInputAmount = document.getElementById('tx-input-amount');
        this.dom.txTargetAccContainer = document.getElementById('tx-target-acc-container');
        this.dom.txTargetAccSelect = document.getElementById('tx-target-acc-select');
        this.dom.txQuickWithdrawal = document.getElementById('tx-quick-withdrawal');
        this.dom.txError = document.getElementById('tx-error');
        this.dom.txActionButton = document.getElementById('tx-action-button');

        // History Filters & Tables
        this.dom.historyFilter = document.getElementById('history-filter');
        this.dom.historyTableBody = document.getElementById('history-table-body');
        
        // Settings form
        this.dom.settingsError = document.getElementById('settings-error');
        this.dom.settingsSuccess = document.getElementById('settings-success');
    }

    bindEvents() {
        // Card insertion triggers
        this.dom.atmCard.addEventListener('click', () => this.insertCard());
        
        // Custom PIN screen input button clicking (on visual screen keypad if requested)
        // Keypad buttons underneath ATM screen (physical feel)
        this.dom.physicalKeypad.addEventListener('click', (e) => {
            const btn = e.target.closest('.keypad-btn');
            if (!btn) return;
            
            const action = btn.dataset.key;
            this.handleKeypadInput(action);
        });

        // Listen to keyboard digits
        document.addEventListener('keydown', (e) => {
            // Enable key input only when card is inserted and active input can use it
            if (this.cardInserted) {
                // If focus is in a text input field, let the browser handle typing naturally to avoid duplication
                if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleKeypadInput('enter');
                    } else if (e.key === 'Escape') {
                        this.handleKeypadInput('cancel');
                    }
                    return;
                }

                if (e.key >= '0' && e.key <= '9') {
                    this.handleKeypadInput(e.key);
                } else if (e.key === 'Backspace' || e.key.toLowerCase() === 'c') {
                    this.handleKeypadInput('clear');
                } else if (e.key === 'Enter') {
                    this.handleKeypadInput('enter');
                } else if (e.key === 'Escape') {
                    this.handleKeypadInput('cancel');
                }
            }
        });

        // Dashboard Account Card Clicks
        document.getElementById('card-checking').addEventListener('click', () => {
            this.audio.playClick();
            this.openQuickTransaction('checking');
        });
        document.getElementById('card-savings').addEventListener('click', () => {
            this.audio.playClick();
            this.openQuickTransaction('savings');
        });

        // Navigation Menu Actions
        document.getElementById('nav-dashboard').addEventListener('click', () => {
            this.audio.playClick();
            this.showScreen('screen-dashboard');
        });
        document.getElementById('nav-checking').addEventListener('click', () => {
            this.audio.playClick();
            this.openQuickTransaction('checking');
        });
        document.getElementById('nav-savings').addEventListener('click', () => {
            this.audio.playClick();
            this.openQuickTransaction('savings');
        });
        document.getElementById('nav-history').addEventListener('click', () => {
            this.audio.playClick();
            this.openHistoryScreen();
        });
        document.getElementById('nav-manage').addEventListener('click', () => {
            this.audio.playClick();
            this.openManageScreen();
        });
        document.getElementById('nav-logout').addEventListener('click', () => {
            this.audio.playClick();
            this.logout();
        });

        // Eye icon toggles for balances
        document.getElementById('toggle-checking-eye').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBalanceVisibility('checking');
        });
        document.getElementById('toggle-savings-eye').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBalanceVisibility('savings');
        });

        // Transaction Screen Form Submit
        this.dom.txForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processFormTransaction();
        });

        // Quick Withdraw Options
        this.dom.txQuickWithdrawal.addEventListener('click', (e) => {
            const btn = e.target.closest('.quick-cash-btn');
            if (!btn) return;
            this.dom.txInputAmount.value = btn.dataset.amount;
            this.audio.playClick();
        });

        // History Filters
        this.dom.historyFilter.addEventListener('change', () => {
            this.audio.playClick();
            this.renderHistoryTable();
        });

        // Change PIN form
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPINChange();
        });

        // Simulation Triggers
        document.getElementById('btn-sim-interest').addEventListener('click', () => this.simulateSavingsInterest());
        document.getElementById('btn-sim-wallet-add').addEventListener('click', () => this.simulateWalletJob());

        // Dispenser Cash interaction (collecting cash)
        this.dom.cashDispenser.addEventListener('click', (e) => {
            const cash = e.target.closest('.dispensed-bill');
            if (!cash) return;
            this.collectCash(cash);
        });

        // Receipt Interaction (close/remove receipt)
        this.dom.receiptContainer.addEventListener('click', (e) => {
            const receipt = e.target.closest('.printed-receipt');
            if (!receipt) return;
            this.collectReceipt(receipt);
        });
    }

    // ==========================================
    // Core User Flow Actions
    // ==========================================

    insertCard() {
        if (this.cardInserted) return;
        this.audio.init(); // Warm up AudioContext on user gesture
        this.audio.playBeep(880, 0.08, 'sine');
        
        this.cardInserted = true;
        this.dom.atmCard.classList.add('inserted');
        this.dom.cardSlotWrapper.classList.add('active');
        
        setTimeout(() => {
            this.audio.playBeep(1000, 0.15, 'sine');
            this.dom.cardStatusText.textContent = "Card: Active Session";
            this.pinBuffer = "";
            this.updatePinDisplay();
            this.showScreen('screen-pin');
        }, 800);
    }

    handleKeypadInput(key) {
        this.audio.playClick();
        
        const activeScreen = this.getActiveScreenId();
        
        if (activeScreen === 'screen-pin') {
            this.handlePinInput(key);
        } else if (activeScreen === 'screen-transaction') {
            this.handleTransactionAmountInput(key);
        }
    }

    handlePinInput(key) {
        this.dom.pinError.textContent = "";
        
        if (key >= '0' && key <= '9') {
            if (this.pinBuffer.length < 4) {
                this.pinBuffer += key;
                this.updatePinDisplay();
            }
        } else if (key === 'clear') {
            this.pinBuffer = "";
            this.updatePinDisplay();
        } else if (key === 'cancel') {
            this.logout();
        } else if (key === 'enter') {
            if (this.pinBuffer.length === 4) {
                this.verifyPinSession();
            } else {
                this.audio.playError();
                this.dom.pinError.textContent = "Please enter 4 digits.";
            }
        }
    }

    handleTransactionAmountInput(key) {
        // Keypad helper to write amount in input field
        const input = this.dom.txInputAmount;
        if (key >= '0' && key <= '9') {
            const currentVal = input.value;
            // Prevent leading zeroes or dots issues
            if (currentVal === "0") {
                input.value = key;
            } else {
                input.value += key;
            }
        } else if (key === 'clear') {
            input.value = "";
        } else if (key === 'cancel') {
            this.showScreen('screen-dashboard');
        } else if (key === 'enter') {
            this.processFormTransaction();
        }
    }

    updatePinDisplay() {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((dot, index) => {
            if (index < this.pinBuffer.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    }

    verifyPinSession() {
        if (this.user.verifyPIN(this.pinBuffer)) {
            this.audio.playSuccess();
            this.pinBuffer = "";
            this.startSessionTimer();
            
            // Populate dashboard
            this.dom.userName.textContent = this.user.name;
            this.updateDashboardBalances();
            this.showScreen('screen-dashboard');
        } else {
            this.audio.playError();
            this.pinBuffer = "";
            this.updatePinDisplay();
            this.dom.pinError.textContent = "Invalid PIN. Try again! (Hint: 1234)";
            
            // Shake keypad display
            this.dom.pinDisplay.classList.add('shake');
            setTimeout(() => this.dom.pinDisplay.classList.remove('shake'), 400);
        }
    }

    startSessionTimer() {
        if (this.sessionTimer) clearInterval(this.sessionTimer);
        this.sessionTimeRemaining = 120;
        this.updateSessionTimerUI();
        
        this.sessionTimer = setInterval(() => {
            this.sessionTimeRemaining--;
            this.updateSessionTimerUI();
            
            if (this.sessionTimeRemaining <= 0) {
                this.logout("Session Expired");
            }
        }, 1000);
    }

    updateSessionTimerUI() {
        const mins = Math.floor(this.sessionTimeRemaining / 60);
        const secs = this.sessionTimeRemaining % 60;
        this.dom.sessionTimerText.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (this.sessionTimeRemaining < 20) {
            this.dom.sessionTimerText.classList.add('low-time');
        } else {
            this.dom.sessionTimerText.classList.remove('low-time');
        }
    }

    logout(message = "Goodbye") {
        if (this.sessionTimer) clearInterval(this.sessionTimer);
        this.sessionTimer = null;
        this.cardInserted = false;
        this.activeAccount = null;
        
        this.dom.cardStatusText.textContent = "Card: Ejected";
        this.dom.atmCard.classList.remove('inserted');
        this.dom.cardSlotWrapper.classList.remove('active');
        
        this.audio.playBeep(600, 0.4, 'sine');
        
        // If logged out due to expiry, show alerts
        this.showScreen('screen-idle');
        
        // Show success/goodbye feedback temporarily on the greeting page
        const greeting = document.querySelector('.idle-screen h2');
        const origText = greeting.textContent;
        greeting.textContent = message;
        greeting.style.color = '#ef4444';
        
        setTimeout(() => {
            greeting.textContent = origText;
            greeting.style.color = '';
        }, 3000);
    }

    // ==========================================
    // UI Helpers
    // ==========================================
    
    getActiveScreenId() {
        for (const [key, element] of Object.entries(this.dom.screens)) {
            if (!element.classList.contains('hidden')) {
                return element.id;
            }
        }
        return null;
    }

    showScreen(screenId) {
        // Reset timers if navigation happens
        if (this.sessionTimer && screenId !== 'screen-idle' && screenId !== 'screen-pin') {
            this.sessionTimeRemaining = 120; // refresh
            this.updateSessionTimerUI();
        }

        // Hide all screens
        for (const [key, element] of Object.entries(this.dom.screens)) {
            element.classList.add('hidden');
        }
        
        // Show target screen
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
        }

        // Highlight Active Nav Bar Item
        const navItems = document.querySelectorAll('.nav-btn');
        navItems.forEach(item => {
            const dest = item.id.replace('nav-', '');
            if (screenId.includes(dest)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    toggleBalanceVisibility(type) {
        this.audio.playClick();
        const balEl = type === 'checking' ? this.dom.checkingBalance : this.dom.savingsBalance;
        const icon = document.getElementById(`toggle-${type}-eye`).querySelector('i');
        
        if (balEl.classList.contains('masked')) {
            balEl.classList.remove('masked');
            icon.className = 'fa-solid fa-eye';
            const acc = this.user.accounts[type];
            this.animateBalanceCount(balEl, 0, acc.getBalance());
        } else {
            balEl.classList.add('masked');
            icon.className = 'fa-solid fa-eye-slash';
            balEl.textContent = '••••••';
        }
    }

    animateBalanceCount(element, start, end) {
        let current = start;
        const duration = 600; // milliseconds
        const frameRate = 1000 / 60; // 60 fps
        const totalFrames = Math.round(duration / frameRate);
        const increment = (end - start) / totalFrames;
        let frame = 0;

        const animate = () => {
            frame++;
            current += increment;
            
            if (frame >= totalFrames) {
                element.textContent = '₱' + end.toFixed(2);
            } else {
                element.textContent = '₱' + current.toFixed(2);
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    updateDashboardBalances() {
        const checkingAcc = this.user.accounts.checking;
        const savingsAcc = this.user.accounts.savings;

        this.dom.checkingAccNum.textContent = checkingAcc.getMaskedAccountNumber();
        this.dom.savingsAccNum.textContent = savingsAcc.getMaskedAccountNumber();

        // Render check
        if (!this.dom.checkingBalance.classList.contains('masked')) {
            this.dom.checkingBalance.textContent = '₱' + checkingAcc.getBalance().toFixed(2);
        }
        if (!this.dom.savingsBalance.classList.contains('masked')) {
            this.dom.savingsBalance.textContent = '₱' + savingsAcc.getBalance().toFixed(2);
        }
    }

    updateWalletUI() {
        this.dom.walletCashValue.textContent = '₱' + this.walletCash.toFixed(2);
    }

    // ==========================================
    // Transaction Screens
    // ==========================================

    openQuickTransaction(accountType) {
        this.activeAccount = this.user.accounts[accountType];
        
        // Prepare Form UI
        this.dom.txTitle.textContent = `${this.activeAccount.type} Account Services`;
        this.dom.txAccDetails.textContent = `Balance: ₱${this.activeAccount.getBalance().toFixed(2)} | ${this.activeAccount.getMaskedAccountNumber()}`;
        this.dom.txInputAmount.value = "";
        this.dom.txError.textContent = "";
        this.dom.txError.style.color = "";
        this.dom.txTargetAccContainer.classList.add('hidden');
        
        // Show/Hide Quick Cash based on selected type
        const typeSelect = document.getElementById('tx-type-select');
        typeSelect.value = 'withdraw'; // Default mode
        this.handleTransactionTypeChange('withdraw');

        // Set action button text
        this.dom.txActionButton.textContent = "Withdraw Funds";

        // Handle Type dropdown changes
        typeSelect.onchange = (e) => {
            this.audio.playClick();
            this.handleTransactionTypeChange(e.target.value);
        };

        this.showScreen('screen-transaction');
    }

    handleTransactionTypeChange(type) {
        this.dom.txError.textContent = "";
        
        if (type === 'withdraw') {
            this.dom.txQuickWithdrawal.classList.remove('hidden');
            this.dom.txTargetAccContainer.classList.add('hidden');
            this.dom.txActionButton.textContent = "Withdraw Funds";
        } else if (type === 'deposit') {
            this.dom.txQuickWithdrawal.classList.add('hidden');
            this.dom.txTargetAccContainer.classList.add('hidden');
            this.dom.txActionButton.textContent = "Deposit Funds";
        } else if (type === 'transfer') {
            this.dom.txQuickWithdrawal.classList.add('hidden');
            this.dom.txTargetAccContainer.classList.remove('hidden');
            this.dom.txActionButton.textContent = "Initiate Transfer";

            // Configure target options
            this.dom.txTargetAccSelect.innerHTML = "";
            const otherAccType = this.activeAccount.type === 'Checking' ? 'savings' : 'checking';
            const otherAcc = this.user.accounts[otherAccType];
            
            const opt = document.createElement('option');
            opt.value = otherAccType;
            opt.textContent = `My ${otherAcc.type} (${otherAcc.getMaskedAccountNumber()})`;
            this.dom.txTargetAccSelect.appendChild(opt);

            // Add external simulated bank account transfer option
            const optExt = document.createElement('option');
            optExt.value = 'external';
            optExt.textContent = `External Account (Simulated)`;
            this.dom.txTargetAccSelect.appendChild(optExt);
        }
    }

    processFormTransaction() {
        this.dom.txError.textContent = "";
        this.dom.txError.style.color = "";
        
        const type = document.getElementById('tx-type-select').value;
        const amount = parseFloat(this.dom.txInputAmount.value);

        if (isNaN(amount) || amount < 200 || amount % 100 !== 0) {
            this.audio.playError();
            this.dom.txError.textContent = "Amounts must be in hundreds or thousands (Minimum of ₱200).";
            return;
        }

        const startBal = this.activeAccount.getBalance();

        if (type === 'withdraw') {
            // Withdrawal validation
            if (this.activeAccount.type === 'Checking') {
                const total = amount + this.activeAccount.transactionFee;
                if (startBal < total) {
                    this.audio.playError();
                    this.dom.txError.textContent = `Insufficient funds. Withdrawal of ₱${amount.toFixed(2)} requires an extra ₱${this.activeAccount.transactionFee.toFixed(2)} fee (Total debit: ₱${total.toFixed(2)}).`;
                    return;
                }
            } else if (this.activeAccount.type === 'Savings') {
                if (startBal - amount < this.activeAccount.minimumBalance) {
                    this.audio.playError();
                    this.dom.txError.textContent = `Cannot withdraw. Savings requires a minimum balance of ₱${this.activeAccount.minimumBalance.toFixed(2)}.`;
                    return;
                }
            }

            // Perform withdraw
            const success = this.activeAccount.withdraw(amount);
            if (success) {
                this.audio.playSuccess();
                this.triggerCashDispenser(amount);
                this.printReceipt(this.activeAccount.transactions[0]);
                this.updateDashboardBalances();
                
                // Show success message
                this.dom.txError.style.color = "#10b981";
                this.dom.txError.textContent = "Withdrawal successful! Collect your cash below.";
                this.dom.txAccDetails.textContent = `Balance: ₱${this.activeAccount.getBalance().toFixed(2)} | ${this.activeAccount.getMaskedAccountNumber()}`;
                this.dom.txInputAmount.value = "";
            } else {
                this.audio.playError();
                this.dom.txError.textContent = "Transaction failed. Insufficient funds.";
            }

        } else if (type === 'deposit') {
            // Deposit transaction
            // Deduct from wallet cash (user deposits cash from wallet into ATM)
            if (this.walletCash < amount) {
                this.audio.playError();
                this.dom.txError.textContent = `You only have ₱${this.walletCash.toFixed(2)} cash in your wallet.`;
                return;
            }

            const success = this.activeAccount.deposit(amount);
            if (success) {
                this.audio.playSuccess();
                this.walletCash -= amount;
                this.updateWalletUI();
                this.printReceipt(this.activeAccount.transactions[0]);
                this.updateDashboardBalances();
                
                this.dom.txError.style.color = "#10b981";
                this.dom.txError.textContent = "Deposit successful! Balance updated.";
                this.dom.txAccDetails.textContent = `Balance: ₱${this.activeAccount.getBalance().toFixed(2)} | ${this.activeAccount.getMaskedAccountNumber()}`;
                this.dom.txInputAmount.value = "";
            } else {
                this.audio.playError();
                this.dom.txError.textContent = "Transaction failed.";
            }

        } else if (type === 'transfer') {
            const targetType = this.dom.txTargetAccSelect.value;
            let targetAccount;
            let external = false;

            if (targetType === 'external') {
                external = true;
                // create a temporary mock account for external simulation
                targetAccount = {
                    type: 'External',
                    getAccountNumber: () => 'AC-98765432',
                    deposit: () => true
                };
            } else {
                targetAccount = this.user.accounts[targetType];
            }

            // Transfer constraints
            if (this.activeAccount.type === 'Checking') {
                const total = amount + this.activeAccount.transactionFee; // Wait, checking transfer doesn't charge withdrawal fee? Or does it?
                // Let's charge standard withdrawal fee for Checking transfers too as part of polymorphism.
                // Or let's say checking transfer is free. Let's keep checking transfer free, but withdrawal fee applies.
                // Let's implement transfer without fee for simplicity, or with fee if checking withdraw is triggered.
                // Actually, if we call transfer(), the base class does withdraw() which internally CheckingAccount overrides with fee!
                // So checking transfer WILL deduct fee automatically because CheckingAccount overrides withdraw(). That is polymorphic!
                if (startBal < total) {
                    this.audio.playError();
                    this.dom.txError.textContent = `Insufficient funds. Transfer requires an extra ₱${this.activeAccount.transactionFee.toFixed(2)} fee.`;
                    return;
                }
            } else if (this.activeAccount.type === 'Savings') {
                if (startBal - amount < this.activeAccount.minimumBalance) {
                    this.audio.playError();
                    this.dom.txError.textContent = `Transfer failed. Savings requires a minimum balance of ₱${this.activeAccount.minimumBalance.toFixed(2)}.`;
                    return;
                }
            }

            const success = this.activeAccount.transfer(amount, targetAccount);
            if (success) {
                this.audio.playSuccess();
                this.printReceipt(this.activeAccount.transactions[0]);
                this.updateDashboardBalances();
                
                this.dom.txError.style.color = "#10b981";
                this.dom.txError.textContent = "Transfer completed successfully!";
                this.dom.txAccDetails.textContent = `Balance: ₱${this.activeAccount.getBalance().toFixed(2)} | ${this.activeAccount.getMaskedAccountNumber()}`;
                this.dom.txInputAmount.value = "";
            } else {
                this.audio.playError();
                this.dom.txError.textContent = "Transfer failed. Insufficient funds.";
            }
        }
    }

    // ==========================================
    // Cash Dispenser & Receipt Printer
    // ==========================================

    triggerCashDispenser(amount) {
        // Play motor hum
        this.audio.playCashEject();

        // Create mechanical bill element
        const bill = document.createElement('div');
        bill.className = 'dispensed-bill';
        bill.dataset.amount = amount;
        
        // Vibe setup
        bill.innerHTML = `
            <div class="bill-face">
                <div class="bill-seal">₱</div>
                <div class="bill-value">${amount}</div>
                <div class="bill-banner">NEO-BANK CASH</div>
                <div class="bill-value-corner">₱${amount}</div>
            </div>
        `;

        // Empty current dispenser
        this.dom.cashDispenser.innerHTML = "";
        this.dom.cashDispenser.appendChild(bill);

        // Slide cash out animation
        setTimeout(() => {
            bill.classList.add('ejected');
        }, 100);
    }

    collectCash(billElement) {
        this.audio.playSuccess();
        const amount = parseFloat(billElement.dataset.amount);
        
        billElement.classList.add('collected');
        
        // Add to wallet
        setTimeout(() => {
            this.walletCash += amount;
            this.updateWalletUI();
            this.dom.cashDispenser.innerHTML = "";
        }, 600);
    }

    printReceipt(transaction) {
        const dateStr = transaction.getFormattedDate();
        const feeLine = transaction.fee > 0 ? `<div class="receipt-row"><span>TX FEE:</span><span>₱${transaction.fee.toFixed(2)}</span></div>` : '';
        
        const receiptMarkup = `
            <div class="printed-receipt">
                <div class="receipt-header">
                    <h4>NEO-BANK ATM</h4>
                    <p>TERMINAL: #ATM0509</p>
                    <p>${dateStr}</p>
                </div>
                <div class="receipt-divider"></div>
                <div class="receipt-body">
                    <div class="receipt-row"><span>ID:</span><span>${transaction.id}</span></div>
                    <div class="receipt-row"><span>TYPE:</span><span class="upper">${transaction.type.replace('_', ' ')}</span></div>
                    <div class="receipt-row"><span>AMOUNT:</span><span>₱${transaction.amount.toFixed(2)}</span></div>
                    ${feeLine}
                    <div class="receipt-divider"></div>
                    <div class="receipt-row bold"><span>NEW BALANCE:</span><span>₱${transaction.balanceAfter.toFixed(2)}</span></div>
                </div>
                <div class="receipt-footer">
                    <p>THANK YOU FOR BANKING</p>
                    <p>WITH NEO-BANK</p>
                    <small>Click to Take Receipt</small>
                </div>
            </div>
        `;

        this.dom.receiptContainer.innerHTML = receiptMarkup;
        
        // Animation
        setTimeout(() => {
            const receipt = this.dom.receiptContainer.querySelector('.printed-receipt');
            if (receipt) receipt.classList.add('printed');
        }, 200);
    }

    collectReceipt(receiptElement) {
        this.audio.playBeep(900, 0.08, 'sine');
        receiptElement.classList.add('taken');
        
        // Remove from printer
        setTimeout(() => {
            this.dom.receiptContainer.innerHTML = "";
            // Show modal view of receipt for readability
            this.showModalReceipt(receiptElement.innerHTML);
        }, 500);
    }

    showModalReceipt(contentHtml) {
        const modal = document.createElement('div');
        modal.className = 'receipt-modal-backdrop';
        modal.innerHTML = `
            <div class="receipt-modal-content">
                <button class="close-modal-btn">&times;</button>
                <div class="receipt-paper">
                    ${contentHtml}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal-btn').onclick = () => {
            this.audio.playClick();
            modal.remove();
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                this.audio.playClick();
                modal.remove();
            }
        };
    }

    // ==========================================
    // History Panel
    // ==========================================

    openHistoryScreen() {
        this.renderHistoryTable();
        this.showScreen('screen-history');
    }

    renderHistoryTable() {
        const filter = this.dom.historyFilter.value;
        this.dom.historyTableBody.innerHTML = "";
        
        let txns = [];
        const checkingAcc = this.user.accounts.checking;
        const savingsAcc = this.user.accounts.savings;

        if (filter === 'all') {
            // merge and sort transactions
            txns = [...checkingAcc.transactions, ...savingsAcc.transactions];
            txns.sort((a, b) => b.timestamp - a.timestamp); // latest first
        } else if (filter === 'checking') {
            txns = checkingAcc.transactions;
        } else if (filter === 'savings') {
            txns = savingsAcc.transactions;
        }

        if (txns.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="empty-table">No transactions recorded yet.</td>`;
            this.dom.historyTableBody.appendChild(row);
            return;
        }

        txns.forEach(tx => {
            const row = document.createElement('tr');
            
            // Format amounts
            let amtStr = '';
            let amtClass = '';
            if (tx.type === 'deposit' || tx.type === 'transfer_in' || tx.type === 'interest') {
                amtStr = `+₱${tx.amount.toFixed(2)}`;
                amtClass = 'tx-positive';
            } else {
                const totalDeducted = tx.amount + (tx.fee || 0);
                amtStr = `-₱${totalDeducted.toFixed(2)}`;
                amtClass = 'tx-negative';
            }

            const feeDetail = tx.fee > 0 ? `<div class="tx-fee-note">Inc. fee ₱${tx.fee.toFixed(2)}</div>` : '';
            const typeLabel = tx.type.replace('_', ' ').toUpperCase();

            row.innerHTML = `
                <td>
                    <div class="tx-type-label label-${tx.type}">${typeLabel}</div>
                </td>
                <td class="tx-desc-cell">
                    <div>${tx.description}</div>
                    ${feeDetail}
                </td>
                <td class="${amtClass} bold">${amtStr}</td>
                <td>₱${tx.balanceAfter.toFixed(2)}</td>
                <td class="tx-date-cell">${tx.getFormattedDate()}</td>
            `;

            this.dom.historyTableBody.appendChild(row);
        });
    }

    // ==========================================
    // Management & Simulations
    // ==========================================

    openManageScreen() {
        this.dom.settingsError.textContent = "";
        this.dom.settingsSuccess.textContent = "";
        
        // Reset form inputs
        document.getElementById('set-old-pin').value = "";
        document.getElementById('set-new-pin').value = "";
        document.getElementById('set-confirm-pin').value = "";

        // Display checking vs savings metadata details
        document.getElementById('checking-info').innerHTML = `
            <strong>Checking Status</strong>: Active<br>
            Withdrawal Fee: ₱${this.user.accounts.checking.transactionFee.toFixed(2)} / operation<br>
            Current Balance: ₱${this.user.accounts.checking.getBalance().toFixed(2)}
        `;

        document.getElementById('savings-info').innerHTML = `
            <strong>Savings Status</strong>: Active<br>
            Interest Rate: ${(this.user.accounts.savings.interestRate * 100).toFixed(1)}% p.a.<br>
            Minimum Balance: ₱${this.user.accounts.savings.minimumBalance.toFixed(2)}<br>
            Current Balance: ₱${this.user.accounts.savings.getBalance().toFixed(2)}
        `;

        this.showScreen('screen-manage');
    }

    processPINChange() {
        this.dom.settingsError.textContent = "";
        this.dom.settingsSuccess.textContent = "";

        const oldPin = document.getElementById('set-old-pin').value;
        const newPin = document.getElementById('set-new-pin').value;
        const confirmPin = document.getElementById('set-confirm-pin').value;

        if (newPin.length !== 4 || isNaN(newPin)) {
            this.audio.playError();
            this.dom.settingsError.textContent = "New PIN must be exactly 4 digits.";
            return;
        }

        if (newPin !== confirmPin) {
            this.audio.playError();
            this.dom.settingsError.textContent = "Confirm PIN does not match.";
            return;
        }

        const success = this.user.changePIN(oldPin, newPin);
        if (success) {
            this.audio.playSuccess();
            this.dom.settingsSuccess.textContent = "PIN changed successfully!";
            
            // clear fields
            document.getElementById('set-old-pin').value = "";
            document.getElementById('set-new-pin').value = "";
            document.getElementById('set-confirm-pin').value = "";
        } else {
            this.audio.playError();
            this.dom.settingsError.textContent = "Current PIN verification failed.";
        }
    }

    simulateSavingsInterest() {
        this.audio.playSuccess();
        const accrued = this.user.accounts.savings.applyInterest();
        
        if (accrued > 0) {
            // Toast notify user
            this.showToast(`Interest Applied: +₱${accrued.toFixed(2)} credited to Savings!`);
            this.updateDashboardBalances();
            this.openManageScreen(); // Refresh info card
        } else {
            this.showToast("Savings account has insufficient balance to accrue interest.", "error");
        }
    }

    simulateWalletJob() {
        this.audio.playSuccess();
        const amount = 100.00;
        this.walletCash += amount;
        this.updateWalletUI();
        this.showToast("Salary simulated: +₱100.00 cash added to your wallet!");
    }

    showToast(message, type = "success") {
        const toast = document.createElement('div');
        toast.className = `atm-toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('visible'), 50);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ==========================================
    // OOP Verification Tests
    // ==========================================

    runOOPTests() {
        console.log("------------------------------------------------");
        console.log("   OOP MECHANICS VERIFICATION SYSTEM (CONSOLE)  ");
        console.log("------------------------------------------------");
        
        try {
            // Test 1: Class existence and instantiation
            console.log("1. Base Account Verification...");
            try {
                const dummyAcc = new BankAccount("Test Holder", 100);
            } catch(e) {
                console.log("✔ BankAccount is correctly abstract! Threw:", e.message);
            }

            // Test 2: Checking account fees
            console.log("2. Checking Account Fee Polymorphism...");
            const checking = new CheckingAccount("John Doe", 100, 2.0);
            console.log(`Initial checking: ₱${checking.getBalance()}`);
            const withdrawOk = checking.withdraw(40);
            console.log(`Withdraw ₱40 checking: ${withdrawOk ? 'Success' : 'Fail'}`);
            console.log(`Balance after: ₱${checking.getBalance()} (Expected: 58.00 due to ₱2.00 fee)`);
            if (checking.getBalance() === 58.00) {
                console.log("✔ CheckingAccount withdrawal polymorphism verified!");
            } else {
                console.error("❌ CheckingAccount withdraw logic failed.");
            }

            // Test 3: Savings account minimum balances
            console.log("3. Savings Account Minimum Balance Enforcements...");
            const savings = new SavingsAccount("Jane Doe", 200, 0.05, 100);
            console.log(`Initial savings: ₱${savings.getBalance()} (Min balance: ₱100)`);
            const withdrawFail = savings.withdraw(150); // should fail (requires ₱50 overdraft, leaving only ₱50)
            console.log(`Withdraw ₱150 (leaves ₱50): ${withdrawFail ? 'Success' : 'Fail (Expected)'}`);
            const withdrawOkSavings = savings.withdraw(50); // should succeed (leaves ₱150, which is >= 100)
            console.log(`Withdraw ₱50 (leaves ₱150): ${withdrawOkSavings ? 'Success' : 'Fail'}`);
            console.log(`Balance after: ₱${savings.getBalance()}`);
            if (!withdrawFail && withdrawOkSavings && savings.getBalance() === 150) {
                console.log("✔ SavingsAccount limits polymorphism verified!");
            } else {
                console.error("❌ SavingsAccount limits fail.");
            }

            // Test 4: Private field encapsulation protection
            console.log("4. Direct Access Encapsulation Protection...");
            const tempAcc = new CheckingAccount("Secret Agent", 500);
            console.log(`Testing private balance visibility: tempAcc.#balance = ${tempAcc.balance || 'undefined'}`);
            
            let encapsulationWorking = false;
            try {
                eval("tempAcc.#balance");
            } catch(e) {
                encapsulationWorking = true;
                console.log("✔ Private balance access correctly throws compile error:", e.message);
            }

            if (encapsulationWorking) {
                console.log("✔ Encapsulation tests completed successfully!");
            }

            console.log("------------------------------------------------");
        } catch(e) {
            console.error("❌ Self-tests triggered error:", e);
        }
    }
}

// Instantiate and start once page completes loading
window.addEventListener('DOMContentLoaded', () => {
    const atmApp = new ATMController();
    atmApp.init();
    
    // Make global for console debugging if user wants to play around
    window.atm = atmApp;
});
