import React from 'react';

import Header from './js/Header';
import Main from './js/Main';


class Master extends React.Component {
    state = {
        userID: undefined
    }

    render() {
        return (
            <div className="Master">
                <Header />
                <Main />
            </div>
        )
    }
}


export default Master;