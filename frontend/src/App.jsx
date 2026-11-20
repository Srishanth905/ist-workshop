import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleAlert,
  LayoutGrid,
  MapPin,
  Search,
  TicketCheck,
  UsersRound,
  X,
  Zap,
} from 'lucide-react'
import { api, API_BASE_URL } from './api.js'

const USER_ID_STORAGE_KEY = 'ist-workshop-user-id'
const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1524179996458-4c8b7b18b5f5?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
]
const REGISTRABLE_STATUSES = new Set(['open', 'upcoming', 'published', 'active', 'live'])

function displayStatus(status) {
  return String(status || 'unknown').replaceAll('_', ' ')
}

function canRegister(status) {
  return REGISTRABLE_STATUSES.has(String(status || '').toLowerCase())
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export default function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [activeEvent, setActiveEvent] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [userId, setUserId] = useState(() => localStorage.getItem(USER_ID_STORAGE_KEY) || '')
  const [registrationMessage, setRegistrationMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [myRegistrations, setMyRegistrations] = useState(null)
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [registrationError, setRegistrationError] = useState('')

  async function loadEvents() {
    setLoading(true)
    setLoadError('')
    try {
      const data = await api.listEvents()
      setEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const openCount = events.filter((event) => canRegister(event.status)).length
  const totalCapacity = events.reduce((total, event) => total + (Number(event.capacity) || 0), 0)
  const filteredEvents = events.filter((event) => {
    const matchesStatus = filter === 'all' || canRegister(event.status)
    const matchesSearch = String(event.title || '').toLowerCase().includes(query.trim().toLowerCase())
    return matchesStatus && matchesSearch
  })

  async function openEvent(event) {
    setActiveEvent(event)
    setRegistrationMessage(null)
    setDetailLoading(true)
    try {
      setActiveEvent(await api.getEvent(event.id))
    } catch (error) {
      setRegistrationMessage({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setDetailLoading(false)
    }
  }

  function closeEvent() {
    setActiveEvent(null)
    setRegistrationMessage(null)
  }

  async function submitRegistration(event) {
    event.preventDefault()
    if (!activeEvent || !userId.trim()) return

    setSubmitting(true)
    setRegistrationMessage(null)
    try {
      const result = await api.register(userId.trim(), activeEvent.id)
      localStorage.setItem(USER_ID_STORAGE_KEY, userId.trim())
      setRegistrationMessage({
        type: 'success',
        text: result.id ? 'Your place is reserved.' : 'Registration completed.',
      })
    } catch (error) {
      setRegistrationMessage({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  async function showMyRegistrations() {
    setMyRegistrations([])
    setRegistrationError('')
    if (!userId.trim()) {
      setRegistrationError('Enter your existing user UUID below to look up registrations.')
      return
    }

    setRegistrationsLoading(true)
    try {
      const data = await api.listRegistrations(userId.trim())
      localStorage.setItem(USER_ID_STORAGE_KEY, userId.trim())
      setMyRegistrations(Array.isArray(data) ? data : [])
    } catch (error) {
      setRegistrationError(getErrorMessage(error))
    } finally {
      setRegistrationsLoading(false)
    }
  }

  const registrationEventTitle = (registration) => (
    events.find((event) => event.id === registration.event_id)?.title || `Event ${registration.event_id?.slice(0, 8) || ''}`
  )

  return (
    <main className="dashboard-shell" id="top">
      <header className="dashboard-header">
        <a className="campus-brand" href="#top" aria-label="CampusPulse home">
          <span className="brand-mark"><Zap size={19} fill="currentColor" /></span>
          <span>Campus<b>Pulse</b></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-active" href="#events"><LayoutGrid size={16} /> Explore Events</a>
          <button onClick={showMyRegistrations} type="button"><TicketCheck size={16} /> My Registrations</button>
        </nav>
        <div className="header-actions">
          <span className="connection-pill"><span /> API connected</span>
          <button className="registrations-button" onClick={showMyRegistrations} type="button">
            <TicketCheck size={16} /> My passes
          </button>
        </div>
      </header>

      <div className="connection-strip">
        <span className="connection-led" />
        <span>LIVE CAMPUS FEED</span>
        <span className="strip-divider">/</span>
        <code>GET /api/events</code>
        <span className="strip-spacer" />
        <span>Connected to <b>{new URL(API_BASE_URL).hostname}</b></span>
      </div>

      <section className="dashboard-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="hero-kicker"><span /> CAMPUS IS IN SESSION</div>
          <h1 id="hero-title">Find your next<br /><em>campus moment.</em></h1>
          <p>Discover what's happening around you. Browse the live board and find a room worth being in.</p>
          <label className="hero-search">
            <Search size={19} />
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Search campus events" value={query} />
            <a href="#events" aria-label="Jump to events"><ArrowUpRight size={18} /></a>
          </label>
        </div>
        <div className="hero-photo" role="img" aria-label="Students gathered for a campus event">
          <img src={EVENT_IMAGES[0]} alt="Students gathering at a campus event" />
          <div className="photo-shade" />
          <div className="photo-label"><span className="photo-live-dot" /> LIVE FROM CAMPUS</div>
          <div className="hero-photo-caption">
            <span>MAKE THE MOST OF YOUR<br />TIME ON CAMPUS.</span>
            <span>IST / {new Date().getFullYear()}</span>
          </div>
        </div>
      </section>

      <section className="metric-row" aria-label="Live event statistics">
        <div className="metric-card"><span>EVENTS ON THE BOARD</span><strong>{loading ? '—' : events.length.toString().padStart(2, '0')}</strong><small>Live from your database</small></div>
        <div className="metric-card metric-accent"><span>UPCOMING SESSIONS</span><strong>{loading ? '—' : openCount.toString().padStart(2, '0')}</strong><small>Ready to explore</small></div>
        <div className="metric-card"><span>PLACES ACROSS EVENTS</span><strong>{loading ? '—' : totalCapacity.toLocaleString()}</strong><small>Combined event capacity</small></div>
        <div className="metric-illustration"><span>YOUR CAMPUS,<br />YOUR NEXT STORY.</span><Zap size={25} fill="currentColor" /></div>
      </section>

      <section className="events-section" id="events">
        <div className="events-heading">
          <div>
            <div className="section-kicker"><span /> THE LIVE BOARD</div>
            <h2>Explore events</h2>
          </div>
          <p>Real sessions from the CampusPulse events feed.</p>
        </div>

        <div className="events-toolbar">
          <div className="event-filters" role="group" aria-label="Filter events">
            {[
              { id: 'all', label: 'All events', count: events.length },
              { id: 'open', label: 'Upcoming', count: openCount },
            ].map((item) => (
              <button
                aria-pressed={filter === item.id}
                className={`event-filter ${filter === item.id ? 'selected' : ''}`}
                key={item.id}
                onClick={() => setFilter(item.id)}
                type="button"
              >
                {item.id === 'all' && <LayoutGrid size={15} />}
                {item.label}<span>{item.count}</span>
              </button>
            ))}
          </div>
          <span className="results-label">{loading ? 'LOADING FEED' : `${filteredEvents.length} RESULTS`}</span>
        </div>

        {loading ? (
          <div className="dashboard-event-grid" aria-label="Loading events">
            {[0, 1, 2].map((item) => <div className="dashboard-skeleton" key={item} />)}
          </div>
        ) : loadError ? (
          <div className="dashboard-state error-state">
            <CircleAlert size={21} />
            <div><strong>Couldn’t load the live board</strong><p>{loadError}</p></div>
            <button className="retry-button" onClick={loadEvents} type="button">Retry <ArrowUpRight size={16} /></button>
          </div>
        ) : filteredEvents.length ? (
          <div className="dashboard-event-grid">
            {filteredEvents.map((event, index) => (
              <article className="dashboard-event-card" key={event.id} style={{ '--card-index': index }}>
                <div className="event-image">
                  <img src={EVENT_IMAGES[index % EVENT_IMAGES.length]} alt="" loading="lazy" />
                  <span className={`event-status ${canRegister(event.status) ? 'status-upcoming' : 'status-muted'}`}>
                    <i />{displayStatus(event.status)}
                  </span>
                  <code>EVT / {String(index + 1).padStart(2, '0')}</code>
                </div>
                <div className="dashboard-event-content">
                  <div className="event-caption"><span>ON CAMPUS</span><span>{String(event.id).slice(0, 8)}</span></div>
                  <h3>{event.title || 'Untitled event'}</h3>
                  <div className="event-facts">
                    <span><UsersRound size={15} /> {event.capacity ?? '—'} places</span>
                    <span><MapPin size={14} /> Organizer {String(event.organizer_id || '—').slice(0, 8)}</span>
                  </div>
                  <button className="event-action" onClick={() => openEvent(event)} type="button">
                    {canRegister(event.status) ? 'Explore & RSVP' : 'View event'} <ArrowUpRight size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-state empty-state">
            <Search size={21} />
            <div><strong>No events found</strong><p>Try another search or clear the current filter.</p></div>
            <button className="retry-button" onClick={() => { setQuery(''); setFilter('all') }} type="button">Clear filters <ArrowUpRight size={16} /></button>
          </div>
        )}
      </section>

      <footer className="dashboard-footer">
        <a className="campus-brand footer-brand" href="#top"><span className="brand-mark"><Zap size={15} fill="currentColor" /></span><span>Campus<b>Pulse</b></span></a>
        <span>Powered by your live campus events API</span>
        <span><i /> ALL SYSTEMS OPERATIONAL</span>
      </footer>

      {(activeEvent || myRegistrations !== null) && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { closeEvent(); setMyRegistrations(null) } }}>
          <section aria-labelledby="modal-title" aria-modal="true" className="detail-modal" role="dialog">
            <button aria-label="Close" className="modal-close" onClick={() => { closeEvent(); setMyRegistrations(null) }} type="button"><X size={20} /></button>
            {activeEvent ? (
              <>
                <div className="modal-kicker"><span className="eyebrow-line" /> SESSION DETAILS</div>
                <div className="modal-status"><span className={String(activeEvent.status).toLowerCase() === 'open' ? 'green-dot' : 'muted-dot'} />{displayStatus(activeEvent.status)}</div>
                <h2 id="modal-title">{activeEvent.title || 'Session details'}</h2>
                <div className="detail-meta">
                  <div><span>CAPACITY</span><strong>{activeEvent.capacity ?? 'Not specified'}</strong></div>
                  <div><span>SESSION ID</span><strong>{activeEvent.id}</strong></div>
                </div>
                {detailLoading && <p className="quiet-note">Refreshing session details…</p>}
                {registrationMessage && (
                  <div className={`feedback-message ${registrationMessage.type}`} role="status">
                    {registrationMessage.type === 'success' ? <Check size={17} /> : <CircleAlert size={17} />}
                    {registrationMessage.text}
                  </div>
                )}
                <form className="registration-form" onSubmit={submitRegistration}>
                  <label htmlFor="attendee-id">Attendee user UUID</label>
                  <input
                    autoComplete="off"
                    id="attendee-id"
                    onChange={(event) => setUserId(event.target.value)}
                    placeholder="Existing users.id UUID"
                    required
                    value={userId}
                  />
                  <p>Your attendee ID is saved only in this browser. No password or sign-in is used.</p>
                  <button className="primary-button" disabled={submitting || !canRegister(activeEvent.status)} type="submit">
                    {submitting ? 'Reserving…' : 'Reserve a place'} <ArrowUpRight size={17} />
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="modal-kicker"><span className="eyebrow-line" /> YOUR ACTIVITY</div>
                <h2 id="modal-title">My registrations<span className="heading-period">.</span></h2>
                <form className="registration-form lookup-form" onSubmit={(event) => { event.preventDefault(); showMyRegistrations() }}>
                  <label htmlFor="lookup-id">Attendee user UUID</label>
                  <input
                    autoComplete="off"
                    id="lookup-id"
                    onChange={(event) => setUserId(event.target.value)}
                    placeholder="Existing users.id UUID"
                    value={userId}
                  />
                  <button className="primary-button" disabled={registrationsLoading || !userId.trim()} type="submit">
                    {registrationsLoading ? 'Looking up…' : 'Find registrations'} <ArrowUpRight size={17} />
                  </button>
                </form>
                {registrationError && <p className="lookup-error" role="alert">{registrationError}</p>}
                {myRegistrations?.length > 0 && (
                  <div className="registration-list">
                    {myRegistrations.map((registration) => (
                      <div className="registration-row" key={registration.id}>
                        <span><TicketCheck size={16} />{registrationEventTitle(registration)}</span>
                        <small>{String(registration.event_id).slice(0, 8)}</small>
                      </div>
                    ))}
                  </div>
                )}
                {myRegistrations?.length === 0 && !registrationsLoading && !registrationError && userId.trim() && (
                  <p className="quiet-note">No registrations found for this attendee.</p>
                )}
              </>
            )}
            <button className="modal-back" onClick={() => { closeEvent(); setMyRegistrations(null) }} type="button"><ArrowLeft size={16} /> Back to sessions</button>
          </section>
        </div>
      )}
    </main>
  )
}