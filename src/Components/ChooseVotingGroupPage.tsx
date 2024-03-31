import React from 'react'

export const ChooseVotingGroupPage = ({ setGroupName, onSubmitGroupName }) => {
  return (
    <div className="field is-horizontal">
      <div className="field-label">
        <label className="label">Voting group</label>
      </div>
      <div className="field-body">
        <input
          className="input"
          onChange={(event) => setGroupName(event.target.value)}
        />
      </div>
      <div className="field-body">
        <button className="button is-info" onClick={() => onSubmitGroupName()}>
          Join
        </button>
      </div>
    </div>
  )
}
