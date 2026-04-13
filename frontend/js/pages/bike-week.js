/* ===========================================
   CB Bikes — Junior Bike Week Page
   Amber (#F59E0B) accent section
   =========================================== */

async function renderBikeWeek(container) {
    let data;
    try {
        data = await API.get('bike-week');
    } catch (err) {
        container.innerHTML = errorStateHTML(err.message);
        return;
    }

    const kpis = data.kpis || {};
    const participants = data.participants || [];
    const events = data.events || [];
    const results = data.race_results || [];
    const guardians = data.guardians || [];

    const participantsJson = escapeAttr(JSON.stringify(participants));
    const eventsJson = escapeAttr(JSON.stringify(events));
    const resultsJson = escapeAttr(JSON.stringify(results));
    const guardiansJson = escapeAttr(JSON.stringify(guardians));

    container.innerHTML = `
        <div x-data="bikeWeekPage()" x-init="initData(${participantsJson}, ${eventsJson}, ${resultsJson}, ${guardiansJson})">
            <div class="section-header">
                <div>
                    <h1 class="section-title">
                        <span class="text-warning">Junior Bike Week</span> 2027
                    </h1>
                    <p class="section-subtitle">Crested Butte's premier youth cycling event</p>
                </div>
            </div>

            <!-- KPI Strip -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="kpi-card kpi-warning">
                    <div class="kpi-value">${formatNumber(kpis.total_participants)}</div>
                    <div class="kpi-label">Participants</div>
                </div>
                <div class="kpi-card kpi-warning">
                    <div class="kpi-value">${formatNumber(kpis.total_events)}</div>
                    <div class="kpi-label">Events</div>
                </div>
                <div class="kpi-card kpi-warning">
                    <div class="kpi-value">${formatCurrency(kpis.total_registration_revenue)}</div>
                    <div class="kpi-label">Registration Revenue</div>
                </div>
                <div class="kpi-card kpi-warning">
                    <div class="kpi-value">${kpis.avg_age != null ? kpis.avg_age.toFixed(1) : '--'}</div>
                    <div class="kpi-label">Avg Age</div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="tab-nav mb-6">
                <template x-for="t in ['Overview', 'Participants', 'Events', 'Race Results', 'Register']" :key="t">
                    <button
                        class="tab-btn"
                        :class="activeTab === t ? 'active-warning' : ''"
                        @click="activeTab = t"
                        x-text="t"
                    ></button>
                </template>
            </div>

            <!-- Overview Tab -->
            <div x-show="activeTab === 'Overview'">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="card">
                        <div class="card-header">Participants by Age Group</div>
                        <div class="card-body">
                            <div class="chart-container" style="height: 280px;">
                                <canvas id="chart-bw-age"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">Events by Type</div>
                        <div class="card-body">
                            <div class="chart-container" style="height: 280px;">
                                <canvas id="chart-bw-events"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Participants Tab -->
            <div x-show="activeTab === 'Participants'">
                <div class="card">
                    <div class="card-body-flush">
                        <div class="table-wrap" style="border: none; border-radius: 0;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Age</th>
                                        <th>Guardian</th>
                                        <th>City / State</th>
                                        <th class="text-right">Events</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template x-for="p in participants" :key="p.participant_id">
                                        <tr>
                                            <td class="font-medium" x-text="p.participant_name"></td>
                                            <td x-text="p.age"></td>
                                            <td x-text="p.guardian_name || '--'"></td>
                                            <td x-text="[p.city, p.state].filter(Boolean).join(', ') || '--'"></td>
                                            <td class="text-right font-mono" x-text="p.events_registered || 0"></td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                        <template x-if="participants.length === 0">
                            ${emptyStateHTML('No participants yet', 'Register the first participant')}
                        </template>
                    </div>
                </div>
            </div>

            <!-- Events Tab -->
            <div x-show="activeTab === 'Events'">
                <div class="card">
                    <div class="card-body-flush">
                        <div class="table-wrap" style="border: none; border-radius: 0;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Type</th>
                                        <th>Date / Time</th>
                                        <th>Location</th>
                                        <th class="text-right">Fee</th>
                                        <th class="text-right">Registered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template x-for="e in events" :key="e.event_id">
                                        <tr>
                                            <td class="font-medium" x-text="e.event_name"></td>
                                            <td>
                                                <span class="badge" :class="e.event_type === 'Race' ? 'badge-Race' : 'badge-Recreational'" x-text="e.event_type"></span>
                                                <span x-show="e.race_type" class="text-xs text-text-muted ml-1" x-text="e.race_type"></span>
                                            </td>
                                            <td>
                                                <span x-text="formatDate(e.event_date)"></span>
                                                <span class="text-text-muted text-xs" x-text="e.event_time"></span>
                                            </td>
                                            <td x-text="e.location_name || '--'"></td>
                                            <td class="text-right font-mono" x-text="formatCurrency(e.registration_fee)"></td>
                                            <td class="text-right font-mono font-semibold" x-text="e.registered_count || 0"></td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                        <template x-if="events.length === 0">
                            ${emptyStateHTML('No events found', 'Events will appear once created')}
                        </template>
                    </div>
                </div>
            </div>

            <!-- Race Results Tab -->
            <div x-show="activeTab === 'Race Results'">
                <div class="card">
                    <div class="card-body-flush">
                        <div class="table-wrap" style="border: none; border-radius: 0;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Race Type</th>
                                        <th>Participant</th>
                                        <th>Age</th>
                                        <th>Finish Time</th>
                                        <th class="text-center">Place</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template x-for="r in results" :key="r.participant_id + '-' + r.event_id">
                                        <tr>
                                            <td class="font-medium" x-text="r.event_name"></td>
                                            <td>
                                                <span class="badge badge-Race" x-text="r.race_type"></span>
                                            </td>
                                            <td x-text="r.participant_name"></td>
                                            <td x-text="r.age"></td>
                                            <td class="font-mono" x-text="r.finish_time"></td>
                                            <td class="text-center">
                                                <span x-show="r.placement === 1" class="placement-gold font-bold text-lg" title="1st Place">&#9733;</span>
                                                <span x-show="r.placement === 2" class="placement-silver font-bold text-lg" title="2nd Place">&#9733;</span>
                                                <span x-show="r.placement === 3" class="placement-bronze font-bold text-lg" title="3rd Place">&#9733;</span>
                                                <span x-show="r.placement > 3" class="text-text-muted" x-text="'#' + r.placement"></span>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                        <template x-if="results.length === 0">
                            ${emptyStateHTML('No race results yet', 'Results appear after races are completed')}
                        </template>
                    </div>
                </div>
            </div>

            <!-- Register Tab -->
            <div x-show="activeTab === 'Register'">
                <div class="card">
                    <div class="card-header">
                        Register for Bike Week
                        <div class="flex items-center gap-2 text-xs text-text-muted">
                            Step <span class="font-mono font-semibold text-warning" x-text="regStep"></span> of 3
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Step Indicators -->
                        <div class="flex items-center gap-4 mb-8">
                            <template x-for="(s, i) in ['Guardian', 'Participant', 'Events']" :key="i">
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                        :class="regStep > i+1 ? 'bg-success text-white' : regStep === i+1 ? 'bg-warning text-white' : 'bg-gray-50 text-text-muted'"
                                    >
                                        <span x-show="regStep <= i+1" x-text="i+1"></span>
                                        <svg x-show="regStep > i+1" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                    </div>
                                    <span class="text-sm font-medium" :class="regStep === i+1 ? 'text-warning' : 'text-text-muted'" x-text="s"></span>
                                    <span x-show="i < 2" class="text-text-muted">&#8594;</span>
                                </div>
                            </template>
                        </div>

                        <!-- Step 1: Guardian -->
                        <div x-show="regStep === 1">
                            <div class="mb-4">
                                <label class="form-label">Use existing guardian?</label>
                                <select class="form-select" x-model.number="reg.guardian_id" @change="onGuardianSelect()">
                                    <option value="0">-- New Guardian --</option>
                                    <template x-for="g in guardians" :key="g.id">
                                        <option :value="g.id" x-text="g.name"></option>
                                    </template>
                                </select>
                            </div>
                            <div x-show="reg.guardian_id === 0 || reg.guardian_id === '0'">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="form-label">First Name *</label>
                                        <input type="text" class="form-input" x-model="reg.guardian_first_name">
                                    </div>
                                    <div>
                                        <label class="form-label">Last Name *</label>
                                        <input type="text" class="form-input" x-model="reg.guardian_last_name">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="form-label">Street Address</label>
                                        <input type="text" class="form-input" x-model="reg.guardian_street">
                                    </div>
                                    <div>
                                        <label class="form-label">City</label>
                                        <input type="text" class="form-input" x-model="reg.guardian_city">
                                    </div>
                                    <div>
                                        <label class="form-label">State</label>
                                        <input type="text" class="form-input" maxlength="2" x-model="reg.guardian_state" placeholder="CO">
                                    </div>
                                    <div>
                                        <label class="form-label">Zip Code</label>
                                        <input type="text" class="form-input" x-model="reg.guardian_zip">
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-end mt-6">
                                <button type="button" class="btn btn-warning" @click="regStep = 2" :disabled="!guardianValid()">
                                    Next: Participant &#8594;
                                </button>
                            </div>
                        </div>

                        <!-- Step 2: Participant -->
                        <div x-show="regStep === 2">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="form-label">First Name *</label>
                                    <input type="text" class="form-input" x-model="reg.first_name">
                                </div>
                                <div>
                                    <label class="form-label">Last Name *</label>
                                    <input type="text" class="form-input" x-model="reg.last_name">
                                </div>
                                <div>
                                    <label class="form-label">Age *</label>
                                    <input type="number" min="4" max="18" class="form-input" x-model.number="reg.age">
                                </div>
                            </div>
                            <div class="flex justify-between mt-6">
                                <button type="button" class="btn btn-secondary" @click="regStep = 1">&#8592; Back</button>
                                <button type="button" class="btn btn-warning" @click="regStep = 3" :disabled="!participantValid()">
                                    Next: Events &#8594;
                                </button>
                            </div>
                        </div>

                        <!-- Step 3: Events -->
                        <div x-show="regStep === 3">
                            <p class="text-sm text-text-secondary mb-4">Select events to register for:</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                <template x-for="e in events" :key="e.event_id">
                                    <label
                                        class="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all"
                                        :class="reg.event_ids.includes(e.event_id) ? 'border-warning bg-warning/5' : 'border-gray-100 hover:border-gray-100/80'"
                                        @click="toggleEvent(e.event_id)"
                                    >
                                        <div class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                                            :class="reg.event_ids.includes(e.event_id) ? 'border-warning bg-warning' : 'border-gray-100'"
                                        >
                                            <svg x-show="reg.event_ids.includes(e.event_id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                            </svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-sm" x-text="e.event_name"></div>
                                            <div class="text-xs text-text-muted" x-text="formatDate(e.event_date) + ' ' + (e.event_time || '')"></div>
                                        </div>
                                        <span class="badge" :class="e.event_type === 'Race' ? 'badge-Race' : 'badge-Recreational'" x-text="e.event_type"></span>
                                        <span class="font-mono text-sm font-semibold" x-text="formatCurrency(e.registration_fee)"></span>
                                    </label>
                                </template>
                            </div>
                            <div class="flex items-center justify-between border-t border-gray-100 pt-4 mb-4">
                                <span class="text-sm text-text-secondary">Total Registration Fee</span>
                                <span class="running-total text-warning" x-text="formatCurrency(regTotal())"></span>
                            </div>
                            <div class="flex justify-between">
                                <button type="button" class="btn btn-secondary" @click="regStep = 2">&#8592; Back</button>
                                <button type="button" class="btn btn-warning" :disabled="reg.event_ids.length === 0 || submitting" @click="submitRegistration()">
                                    <span x-show="!submitting">Register Participant</span>
                                    <span x-show="submitting">Registering...</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Render overview charts after DOM is ready
    requestAnimationFrame(() => {
        renderBikeWeekCharts(participants, events);
    });
}

function renderBikeWeekCharts(participants, events) {
    // Age distribution
    if (participants.length) {
        const ageBuckets = {};
        for (const p of participants) {
            const bracket = p.age <= 7 ? '4-7' : p.age <= 10 ? '8-10' : p.age <= 13 ? '11-13' : '14-18';
            ageBuckets[bracket] = (ageBuckets[bracket] || 0) + 1;
        }
        const labels = ['4-7', '8-10', '11-13', '14-18'];
        const data = labels.map(l => ageBuckets[l] || 0);
        createBarChart('chart-bw-age', labels, data, 'Participants', ['#F59E0B', '#D97706', '#B45309', '#92400E']);
    }
    // Events by type
    if (events.length) {
        const raceCount = events.filter(e => e.event_type === 'Race').length;
        const recCount = events.filter(e => e.event_type === 'Recreational').length;
        createDonutChart('chart-bw-events', ['Race', 'Recreational'], [raceCount, recCount], ['#EF4444', '#10B981']);
    }
}

function bikeWeekPage() {
    return {
        activeTab: 'Overview',
        participants: [],
        events: [],
        results: [],
        guardians: [],
        regStep: 1,
        submitting: false,
        reg: {
            guardian_id: 0,
            guardian_first_name: '', guardian_last_name: '',
            guardian_street: '', guardian_city: '', guardian_state: '', guardian_zip: '',
            guardian_waiver: true,
            first_name: '', last_name: '', age: '',
            event_ids: [],
        },

        initData(participants, events, results, guardians) {
            this.participants = participants;
            this.events = events;
            this.results = results;
            this.guardians = guardians;
        },

        onGuardianSelect() {
            // Clear new guardian fields when selecting existing
            if (this.reg.guardian_id > 0) {
                this.reg.guardian_first_name = '';
                this.reg.guardian_last_name = '';
            }
        },

        guardianValid() {
            if (this.reg.guardian_id > 0) return true;
            return this.reg.guardian_first_name.trim() && this.reg.guardian_last_name.trim();
        },

        participantValid() {
            return this.reg.first_name.trim() && this.reg.last_name.trim() && this.reg.age >= 4 && this.reg.age <= 18;
        },

        toggleEvent(eventId) {
            const idx = this.reg.event_ids.indexOf(eventId);
            if (idx >= 0) this.reg.event_ids.splice(idx, 1);
            else this.reg.event_ids.push(eventId);
        },

        regTotal() {
            return this.reg.event_ids.reduce((sum, eid) => {
                const ev = this.events.find(e => e.event_id === eid);
                return sum + (ev ? ev.registration_fee : 0);
            }, 0);
        },

        async submitRegistration() {
            if (this.reg.event_ids.length === 0) return;
            this.submitting = true;
            try {
                const body = {
                    first_name: this.reg.first_name,
                    last_name: this.reg.last_name,
                    age: this.reg.age,
                    event_ids: this.reg.event_ids,
                };
                if (this.reg.guardian_id > 0) {
                    body.guardian_id = this.reg.guardian_id;
                } else {
                    body.guardian_first_name = this.reg.guardian_first_name;
                    body.guardian_last_name = this.reg.guardian_last_name;
                    body.guardian_street = this.reg.guardian_street;
                    body.guardian_city = this.reg.guardian_city;
                    body.guardian_state = this.reg.guardian_state;
                    body.guardian_zip = this.reg.guardian_zip;
                    body.guardian_waiver = this.reg.guardian_waiver;
                }
                await API.post('bike-week/register', body);
                showToast('Participant registered successfully!');
                // Reset and reload
                this.regStep = 1;
                this.reg = {
                    guardian_id: 0,
                    guardian_first_name: '', guardian_last_name: '',
                    guardian_street: '', guardian_city: '', guardian_state: '', guardian_zip: '',
                    guardian_waiver: true,
                    first_name: '', last_name: '', age: '',
                    event_ids: [],
                };
                const data = await API.get('bike-week');
                this.participants = data.participants || [];
                this.events = data.events || [];
                this.results = data.race_results || [];
                this.guardians = data.guardians || [];
                this.activeTab = 'Participants';
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                this.submitting = false;
            }
        },
    };
}
