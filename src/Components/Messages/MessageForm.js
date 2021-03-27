import React from 'react'
import { Segment, Button, Input } from 'semantic-ui-react'

class MessageForm extends React.Component {
  render() {
    return (
      <Segment className="message__form">
        <Input
          fluid
          name="message"
          style={{ marginBotttom: '0.7em' }}
          label={<Button icon={'add'} />}
          labelPosition="left"
          placeHolder="Write your message"
        />
        <Button.Group icon widths="2">
          <Button
            color= "orange"
            content="Add reply"
            labelPosition="left"
            icon="edit"
          />
          <Button
            color= "teal"
            content="Upload Media"
            labelPosition="right"
            icon="Cloud upload"
          />
        </Button.Group>
      </Segment>
    )
  }
}

export default MessageForm