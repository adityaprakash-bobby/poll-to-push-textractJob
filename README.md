# poll-to-push-textractJob
A react app to do aysynchronous text analysis/detection without polling for the asynchronous response from the Textract Application.

![solution_arch](https://raw.githubusercontent.com/adityaprakash-bobby/poll-to-push-textractJob/master/assets/solution_arch.png)

### Lambdas:
All lambdas have a basic execution role for cloudwatch logging.

#### For calling async textract operations:

**Roles**:
- S3 Read Only access
- Textract Full access

#### For listening to SNS:

**Roles**:
- S3 Full access
- API Gateway Invoke Full access
- DynamoDB Read Only access
- Textract Full access

#### For saving jobId against websocket connectionId:

**Roles**:
- DynamoDB Full access

### SNS Configuration for textract:
Create a service role for Textract and add the **SNSFullAccess** role for textract to be able to write to SNS topics.
