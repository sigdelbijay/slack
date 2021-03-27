import React from 'react';
import { Grid } from 'semantic-ui-react'
import './App.css';
import {connect} from 'react-redux'

import ColorPanel from './ColorPanel/ColorPanel'
import MetaPanel from './MetaPanel/MetaPanel'
import Messages from './Messages/Messages'
import SidePanel from './SidePanel/SidePanel'


const App = ({currentUser}) => (
  <Grid columns="equal" className="app" style={{background: '#eee'}}>
    <ColorPanel />
    <SidePanel currentUser={currentUser}/>
    <Grid.Column style = {{marginLeft: 320}}>
      <Messages />
    </Grid.Column>
    <Grid.Column>
      <MetaPanel width={4}/>
    </Grid.Column>
  </Grid>
)
const mapStateToProps = state => ({
  currentUser: state.user.currentUser
})

export default connect(mapStateToProps)(App);
