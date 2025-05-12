import React, { useState, useEffect } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { getDatabase, ref, set, get } from 'firebase/database'
import { Profile } from './Models'

type AdminPageProps = {
  profile: Profile
  onBack: () => void
}

type VotingEvent = {
  id?: string
  name: string
  countries: string[]
}

const EUROVISION_COUNTRIES = [
  'Albania',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Georgia',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Israel',
  'Italy',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Moldova',
  'Montenegro',
  'Netherlands',
  'North Macedonia',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'San Marino',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'Ukraine',
  'United Kingdom',
].sort()

export const AdminPage = ({ profile, onBack }: AdminPageProps) => {
  const [events, setEvents] = useState<VotingEvent[]>([])
  const [newEventName, setNewEventName] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<VotingEvent | null>(null)
  const [activeEvent, setActiveEvent] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
    loadActiveEvent()
  }, [])

  const loadEvents = async () => {
    const db = getDatabase()
    const eventsRef = ref(db, 'votingEvents')
    const snapshot = await get(eventsRef)
    if (snapshot.exists()) {
      const eventsData = snapshot.val()
      const eventsList = Object.entries(eventsData).map(
        ([id, event]: [string, any]) => ({
          id,
          name: id,
          countries: event.countries || [],
        }),
      )
      setEvents(eventsList)
    }
  }

  const loadActiveEvent = async () => {
    const db = getDatabase()
    const activeEventRef = ref(db, 'activeEvent')
    const snapshot = await get(activeEventRef)
    if (snapshot.exists()) {
      setActiveEvent(snapshot.val())
    }
  }

  const createEvent = async () => {
    if (!newEventName.trim()) return

    const db = getDatabase()
    const newEventRef = ref(db, `votingEvents/${newEventName}`)
    const newEvent: VotingEvent = {
      name: newEventName,
      countries: [],
    }

    await set(newEventRef, newEvent)
    setEvents([...events, newEvent])
    setNewEventName('')
  }

  const toggleCountry = async (country: string) => {
    if (!selectedEvent) return

    const updatedCountries = selectedEvent.countries.includes(country)
      ? selectedEvent.countries.filter((c) => c !== country)
      : [...selectedEvent.countries, country]

    const updatedEvent = { ...selectedEvent, countries: updatedCountries }

    const db = getDatabase()
    await set(ref(db, `votingEvents/${selectedEvent.name}`), updatedEvent)

    setSelectedEvent(updatedEvent)
    setEvents(
      events.map((e) => (e.name === selectedEvent.name ? updatedEvent : e)),
    )
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !selectedEvent) return

    const items = Array.from(selectedEvent.countries)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedEvent = { ...selectedEvent, countries: items }

    const db = getDatabase()
    await set(ref(db, `votingEvents/${selectedEvent.name}`), updatedEvent)

    setSelectedEvent(updatedEvent)
    setEvents(
      events.map((e) => (e.name === selectedEvent.name ? updatedEvent : e)),
    )
  }

  const updateActiveEvent = async (eventName: string) => {
    const db = getDatabase()
    await set(ref(db, 'activeEvent'), eventName)
    setActiveEvent(eventName)
  }

  return (
    <div className="container p-4">
      <div className="level">
        <div className="level-left">
          <h1 className="title">Admin Panel</h1>
        </div>
        <div className="level-right">
          <button className="button is-light" onClick={onBack}>
            Back to Voting
          </button>
        </div>
      </div>

      {/* Create New Event */}
      <div className="box mb-4">
        <h2 className="subtitle">Create New Voting Event</h2>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              placeholder="Event Name"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
            />
          </div>
          <div className="control">
            <button className="button is-primary" onClick={createEvent}>
              Create Event
            </button>
          </div>
        </div>
      </div>

      {/* Event Selection */}
      <div className="box mb-4">
        <h2 className="subtitle">Select Event</h2>
        <div className="buttons">
          {events.map((event) => (
            <div key={event.name} className="buttons has-addons">
              <button
                className={`button ${
                  selectedEvent?.name === event.name ? 'is-primary' : 'is-light'
                }`}
                onClick={() => setSelectedEvent(event)}
              >
                {event.name}
              </button>
              {activeEvent === event.name ? (
                <button className="button is-success" disabled>
                  Active
                </button>
              ) : (
                <button
                  className="button is-success"
                  onClick={() => updateActiveEvent(event.name)}
                  title="Set as Active"
                >
                  Set Active
                </button>
              )}
            </div>
          ))}
        </div>
        {activeEvent && (
          <div className="mt-2">
            <p className="has-text-success">
              <strong>Active Event:</strong> {activeEvent}
            </p>
          </div>
        )}
      </div>

      {/* Country Management */}
      {selectedEvent && (
        <div className="box">
          <h2 className="subtitle">Manage Countries</h2>

          {/* Available Countries */}
          <div className="mb-4">
            <h3 className="subtitle is-5">Available Countries</h3>
            <div className="columns is-multiline is-mobile">
              {EUROVISION_COUNTRIES.map((country) => (
                <div
                  key={country}
                  className="column is-2-desktop is-3-tablet is-4-mobile"
                >
                  <button
                    className={`button is-fullwidth is-small ${
                      selectedEvent.countries.includes(country)
                        ? 'is-success'
                        : 'is-light'
                    }`}
                    onClick={() => toggleCountry(country)}
                  >
                    {country}
                    {selectedEvent.countries.includes(country) &&
                      ` (${selectedEvent.countries.indexOf(country) + 1})`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Countries */}
          <div>
            <h3 className="subtitle is-5">Selected Countries</h3>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="countries">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="box"
                  >
                    {selectedEvent.countries.map((country, index) => (
                      <Draggable
                        key={country}
                        draggableId={country}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="box mb-2 is-flex is-justify-content-space-between is-align-items-center"
                          >
                            <span>
                              {index + 1}. {country}
                            </span>
                            <button
                              className="button is-danger is-small"
                              onClick={() => toggleCountry(country)}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      )}
    </div>
  )
}
