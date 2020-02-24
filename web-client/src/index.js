import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import AWS, { IoTThingsGraph } from 'aws-sdk';

// API details
const API_URL = "https://7q1i0pgrhj.execute-api.us-east-1.amazonaws.com/default/amazontextractcallasynctextract"
const WEBSOCK_URL = "wss://ocf3ol0168.execute-api.us-east-1.amazonaws.com/default"

// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:9b4b6b97-13c3-4856-85e8-2e62556cb7c5',
});

let bucket = new AWS.S3({
    params: {
        Bucket: 'test-lambda-tt'
    }
});

class UploadFileComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            inputFile: '',
            inputFilePath: '',
            imageBase64: '',
            ws: null,
            textarctJSON: '',
            jsonData: ''
        }

        this.handleInputFile = this.handleInputFile.bind(this);
    }

    handleInputFile(event) {
        
        if (event.target.files.length === 1) {
            var _validFileExtensions = ["jpg", "jpeg", "png", "pdf"];
            var fileUploadPath = event.target.value;
            var fileExtension = fileUploadPath.substring(
                fileUploadPath.lastIndexOf('.') + 1).toLowerCase();
            console.log(event.target.files);
            
            var fileName = event.target.files[0]['name']
            
            
            if (_validFileExtensions.includes(fileExtension)) {
                this.setState({
                    inputFile: fileUploadPath
                });
        
                let files = event.target.files;
                // console.log(files);
                
                let reader = new FileReader();
                reader.readAsDataURL(files[0]);
        
                reader.onload = (event) => {
                    this.setState({
                        inputFilePath: URL.createObjectURL(files[0]),
                        imageFile: files[0],
                        inputFileName: fileName
                    });
                }

            } else {
                alert("File supported: '.png', '.jpg', '.jpeg', '.pdf'");
                this.setState({});
            }
        } else {
            this.setState({
                inputFile: '',
                inputFilePath: '',
                textarctJSON: '',
                jsonData: ''
            });
        }   
        
    }

    componentDidMount() {
        this.connect();
    }

    connect = () => {
        var ws = new WebSocket(WEBSOCK_URL);
        let that = this; // cache the this
        var connectInterval;

        // websocket onopen event listener
        ws.onopen = () => {
            console.log("connected websocket main component");

            this.setState({ ws: ws });

            that.timeout = 250; // reset timer to 250 on open of websocket connection 
            clearTimeout(connectInterval); // clear Interval on on open of websocket connection
        };

        // websocket onclose event listener
        ws.onclose = e => {
            console.log(
                `Socket is closed. Reconnect will be attempted in ${Math.min(
                    10000 / 1000,
                    (that.timeout + that.timeout) / 1000
                )} second.`,
                e.reason
            );

            that.timeout = that.timeout + that.timeout; //increment retry interval
            connectInterval = setTimeout(this.check, Math.min(10000, that.timeout)); //call check function after timeout
        };

        ws.onmessage = evt => {
            // on receiving a message, add it to the list of messages
            const message = JSON.parse(evt.data)
            this.setState({
                textarctJSON: message
            })

            let params_get = {
                Key: message
            }
        
            bucket.getObject(params_get).promise()
                .then((data) => {
                this.setState({
                    jsonData: String.fromCharCode.apply(null, data.Body)
                });
                console.log(String.fromCharCode.apply(null, data.Body));
                
            });

            console.log(message)
        }
    
        
        // websocket onerror event listener
        ws.onerror = err => {
            console.error(
                "Socket encountered error: ",
                err.message,
                "Closing socket"
            );

            ws.close();
        };
    };

    check = () => {
        const { ws } = this.state;
        if (!ws || ws.readyState == WebSocket.CLOSED) this.connect(); //check if websocket instance is closed, if so call `connect` function.
    };

    render () {
        
        return (
            <div>
                <div className="split left">
                    <div className="centered">
                        {this.state.inputFilePath === ''?<br />:<img src={this.state.inputFilePath} alt="uploadedimage"></img>}
                        <input type="file" name='filename' value={this.state.inputFile} onChange={this.handleInputFile} />
                    </div>
                </div>
                
                <ViewJSON 
                    websocket={this.state.ws} 
                    inputFilePath={this.state.inputFilePath} 
                    imageFile={this.state.imageFile} 
                    imageFileName={this.state.inputFileName} 
                    textarctJSON={this.state.textarctJSON} 
                    jsonData={this.state.jsonData}
                />
            </div>
        )
    };
}

class ViewJSON extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            json: '',
            s3Upload: false,
            s3ObjKey: '',
            jobId: ''
        }
        this.reset = this.reset.bind(this);
        this.putDataS3 = this.putDataS3.bind(this);
        this.makeDetection = this.makeDetection.bind(this);
    }

    reset(e) {
        e.preventDefault();
        this.setState({
            json: '',
            s3Upload: false,
            s3ObjKey: '',
            jobId: ''
        });
    }

    putDataS3(e) {

        e.preventDefault();
        
        if (this.props.inputFilePath === '') {
            alert("upload a file first");
        } else {
            let objKey = 'app/' + this.props.imageFileName;
            console.log(objKey);
            
            let params = {
                Key: objKey,
                Body: this.props.imageFile,
            };

            bucket.putObject(params).promise()
                .then((res) => {
                    console.log("uploaded", res)
                    this.setState({
                        s3Upload: true,
                        s3ObjKey: objKey
                    })
                });

        }
    }

    makeDetection() {
       
        if (!this.state.s3Upload || this.state.s3ObjKey === '') {
            alert("Upload a valid file to S3 first.")
        } else {
            // fetch()
            console.log("Detecting text....")
            var postBody = {
                bucket: 'test-lambda-tt',
                objkey: this.state.s3ObjKey
            }

            fetch(API_URL, {
                headers: {
                    'content-type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify(postBody)
            })
                .then(res => res.json())
                .then(res => {
                    this.setState({
                        jobId: res
                    })

                    const websocket = this.props.websocket // websocket instance passed as props to the child component.

                    try {
                        websocket.send(`{"action":"save", "jobid":"${res}"}`);
                    } catch (error) {
                        console.log(error)
                    }
                });
        }

    }

    render() {
    
        return (
            <div>
                <div className="split right">
                    <div className="centered">
                    <button onClick={this.makeDetection}>Detect</button>
                    &nbsp;
                    <button onClick={this.putDataS3}>Upload to S3</button>
                    &nbsp;
                    <button onClick={this.reset}>Clear</button>
                    {!this.state.s3Upload?<br />:<p>Object Key Uploaded: {this.state.s3ObjKey}</p>}
                    {this.state.jobId === ''?<br />:<p>Textract JobId Started: {this.state.jobId}</p>}
                    {this.state.json === ''?<br />:<p>Textract JSON: {this.state.json}</p>}
                    {this.props.jsonData === ''?<br />:<pre><code>{JSON.stringify(JSON.parse(this.props.jsonData), null, 4)}</code></pre>}
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<UploadFileComponent />, document.getElementById('root'));