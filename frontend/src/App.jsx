import { useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleAlert,
  Compass,
  Search,
  TicketCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { api, API_BASE_URL } from './api.js'

const USER_ID_STORAGE_KEY = 'ist-workshop-user-id'

function displayStatus(status) {
  return String(status || 'unknown').replaceAll('_', ' ')
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

  const openCount = events.filter((event) => String(event.status).toLowerCase() === 'open').length
  const filteredEvents = events.filter((event) => {
    const matchesStatus = filter === 'all' || String(event.status).toLowerCase() === filter
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
    <main className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="IST Workshop home">
          <span className="wordmark-mark">i</span>
          <span>IST <b>/</b> WORKSHOP</span>
        </a>
        <div className="topbar-right">
          <span className="api-state"><span className="api-dot" /> LIVE API</span>
          <button className="my-pass-button" onClick={showMyRegistrations} type="button">
            <TicketCheck size={17} strokeWidth={1.8} /> My registrations
          </button>
        </div>
      </header>

      <section className="intro" id="top">
        <div className="intro-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> LEARN TOGETHER, BUILD WHAT'S NEXT</div>
          <h1>Make room<br />for <em>what's next.</em></h1>
          <p>Small-group workshops for curious minds. Find a session, bring your questions, leave with something new.</p>
          <a className="intro-link" href="#sessions">Explore sessions <ArrowDownRight size={17} /></a>
        </div>
        <div className="intro-image-wrap" aria-label="People gathered at a creative workshop" role="img">
          <div className="intro-image" />
          <div className="image-caption"><span>IDEAS ARE BETTER, SHARED.</span><span>IST / FIELD NOTES 01</span></div>
          <div className="image-stamp"><Compass size={18} /><span>OPEN<br />THE ROOM</span></div>
        </div>
      </section>

      <section className="session-section" id="sessions">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> THE PROGRAMME</div>
            <h2>Find your next session<span className="heading-period">.</span></h2>
          </div>
          <div className="session-total"><strong>{events.length.toString().padStart(2, '0')}</strong><span>SESSIONS<br />ON THE BOARD</span></div>
        </div>

        <div className="toolbar">
          <div className="filters" role="group" aria-label="Filter events">
            {[
              { id: 'all', label: 'All sessions', count: events.length },
              { id: 'open', label: 'Open', count: openCount },
            ].map((item) => (
              <button
                aria-pressed={filter === item.id}
                className={`filter-button ${filter === item.id ? 'is-selected' : ''}`}
                key={item.id}
                onClick={() => setFilter(item.id)}
                type="button"
              >
                {item.label}<span>{item.count}</span>
              </button>
            ))}
          </div>
          <label className="search-box">
            <Search size={17} strokeWidth={1.8} />
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Search sessions" value={query} />
            <kbd>/</kbd>
          </label>
        </div>

        {loading ? (
          <div className="event-grid" aria-label="Loading sessions">
            {[0, 1, 2].map((item) => <div className="event-skeleton" key={item} />)}
          </div>
        ) : loadError ? (
          <div className="state-panel error-panel">
            <CircleAlert size={20} />
            <div><strong>Sessions didn't load</strong><p>{loadError}</p></div>
            <button className="text-button" onClick={loadEvents} type="button">Try again <ArrowUpRight size={16} /></button>
          </div>
        ) : filteredEvents.length ? (
          <div className="event-grid">
            {filteredEvents.map((event, index) => {
              const isOpen = String(event.status).toLowerCase() === 'open'
              return (
                <article className="event-card" key={event.id} style={{ '--card-index': index }}>
                  <div className="event-card-top">
                    <span className={`status-tag ${isOpen ? 'status-open' : 'status-other'}`}>
                      <span />{displayStatus(event.status)}
                    </span>
                    <span className="event-number">SESSION / {String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{event.title || 'Untitled session'}</h3>
                  <div className="event-card-meta">
                    <span><UsersRound size={15} /> {event.capacity ?? '—'} places</span>
                    <span className="event-id">{String(event.id).slice(0, 8)}</span>
                  </div>
                  <button className="event-link" onClick={() => openEvent(event)} type="button">
                    Explore session <ArrowUpRight size={17} />
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="state-panel empty-panel">
            <Search size={21} />
            <div><strong>No sessions found</strong><p>Try a different search or switch back to all sessions.</p></div>
            <button className="text-button" onClick={() => { setQuery(''); setFilter('all') }} type="button">Clear filters <ArrowUpRight size={16} /></button>
          </div>
        )}

        <footer className="page-footer">
          <span>MADE FOR THE MAKERS, THINKERS & DOERS.</span>
          <span>CONNECTED TO <b>{new URL(API_BASE_URL).hostname}</b></span>
        </footer>
      </section>

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
                  <button className="primary-button" disabled={submitting || !String(activeEvent.status).toLowerCase().includes('open')} type="submit">
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