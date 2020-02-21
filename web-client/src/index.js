import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import AWS from 'aws-sdk';

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
            imageBase64: ''
        }

        this.handleInputFile = this.handleInputFile.bind(this);
    }

    handleInputFile(event) {
        
        var _validFileExtensions = ["jpg", "jpeg", "png", "pdf"];
        var fileUploadPath = event.target.value;
        var fileExtension = fileUploadPath.substring(
            fileUploadPath.lastIndexOf('.') + 1).toLowerCase();
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
            alert("Image file supported: '.png', '.jpg', '.jpeg'");
            this.setState({});
        }
        
    }

    render () {
        
        return (
            <div>
                <div className="split left">
                    <div className="centered">
                        {this.state.inputFilePath === ''?<br />:<img src={this.state.inputFilePath} alt="uploadedimage"></img>}
                        <input type="file" name='filename' value={this.state.inputFile} onChange={this.handleInputFile} />
                    </div>
                </div>
                
                <ViewJSON inputFilePath={this.state.inputFilePath} imageFile={this.state.imageFile} imageFileName={this.state.inputFileName}/>
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
       
        if (!this.state.s3Upload || this.states3ObjKey === '') {
            alert("Upload a valid file to S3 first.")
        } else {
            // fetch()
            console.log("Chal ab karle detect")
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
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<UploadFileComponent />, document.getElementById('root'));


// Fetch POST

// fetch(url, {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'X-Api-Key': xApiKey
//     },
//     body: JSON.stringify({"Image":this.props.imageBase64})})
//     .then((response) => response.json())
//     .then((response) => console.log(response))

    // componentDidMount() {
    //     var myHeaders = new Headers();
    //     myHeaders.append("Content-Type", "application/json");
    //     myHeaders.append("X-Api-Key", "K4aXwSHPeR7Vf0RxlP0F26Zk6LDKHgtS7xXbYFqr");

    //     var raw = JSON.stringify({"Image":"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"});

    //     var requestOptions = {
    //         method: 'POST',
    //         headers: myHeaders,
    //         body: raw,
    //         // redirect: 'follow',
    //         mode: 'no-cors'
    //     };

    //     fetch("https://5mybkiifji.execute-api.us-east-1.amazonaws.com/default/detectText", requestOptions)
    //         .then(response => response.text())
    //         .then(result => {
    //             // console.log(result)
    //             this.setState({
    //                 json: result,
    //                 loading: false
    //             })
    //         })
    //         .catch(error => {
    //             console.log('error', error)
    //             // this.setState({
    //             //     json: [error],
    //             //     loading: false
    //             // })
    //         });
    //     // .then((data) => console.log(data));
    // }