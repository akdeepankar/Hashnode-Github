const axios = require('axios');

// Hashnode GraphQL API endpoint
const hashnodeApiEndpoint = 'https://api.hashnode.com';

// Function to publish a blog post on Hashnode with retry logic
async function publishBlogPost() {
  const maxRetries = 3; // Maximum number of retry attempts
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Retrieve commit information using GitHub Actions environment variables
      const commitSHA = process.env.GITHUB_SHA;
      const commitMessage = process.env.GITHUB_MESSAGE;

      // Hashnode API key
      const hashnodeApiKey = process.env.HASHNODE_API_KEY;

      // GraphQL mutation to create a new blog post
      const mutation = `
        mutation {
          createStory(
            input: {
              title: "New Blog Post - ${commitSHA.substring(0, 8)}"
              contentMarkdown: "Commit Message: ${commitMessage}\\n\\nThis blog post was automatically generated on each commit."
            }
          ) {
            id
            title
            slug
          }
        }
      `;

      // Hashnode API request to create a new blog post
      const response = await axios.post(
        hashnodeApiEndpoint,
        {
          query: mutation,
        },
        {
          headers: {
            Authorization: `Bearer ${hashnodeApiKey}`,
          },
        }
      );

      // Hashnode API response
      const createdPost = response.data.data.createStory;
      console.log(`Blog post created: ${createdPost.title}`);
      return; // Successful, exit the loop
    } catch (error) {
      if (error.response && error.response.status === 502) {
        console.log('Received a 502 Bad Gateway error. Retrying...');
        retryCount++;
        // Add delay before retrying (optional)
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds delay
      } else {
        console.error('Error publishing blog post:', error.response ? error.response.data : error.message);
        process.exit(1);
      }
    }
  }

  console.error(`Failed to publish blog post after ${maxRetries} retries.`);
  process.exit(1);
}

// Run the function to publish the blog post
publishBlogPost();
