using UnityEngine;

public class PlayerController : MonoBehaviour
{
    Rigidbody2D body;
    public float forceValue = 20f;
    public float maxVerticalVelocity = 10f; // Adjust this value as needed

    void Start()
    {
        body = GetComponent<Rigidbody2D>();
        if (body == null)
        {
            Debug.LogError("Rigidbody2D component is missing from the soccer ball GameObject.");
        }
    }

    void Update()
    {
        if (GameManager.isPlaying && (Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.Space)))
        {
            // Apply force only if the ball is moving downwards (prevents excessive jumping when holding the mouse button)
            if (body.linearVelocity.y <= 0)
            {
                body.linearVelocity = Vector2.zero;  // Reset the velocity to have consistent force application
                body.AddForce(Vector2.up * forceValue, ForceMode2D.Impulse);

                // Increment score for each successful juggle
                GameManager.IncrementScore();
            }
        }

        // Limit vertical velocity
        if (body.linearVelocity.y > maxVerticalVelocity)
        {
            body.linearVelocity = new Vector2(body.linearVelocity.x, maxVerticalVelocity);
        }

        // Only check if ball goes too high or hits the ground
        if (transform.position.y > 1.15f || transform.position.y < -1.15f)
        {
            Debug.Log("Soccer ball out of bounds. Stopping the game.");
            GameManager.isPlaying = false;
        }
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        // Only end game if colliding with ground
        if (collision.gameObject.name == "Ground")
        {
            Debug.Log("Soccer ball hit the ground. Game over!");
            GameManager.isPlaying = false;
        }
        else
        {
            Debug.Log("Soccer ball collided with: " + collision.gameObject.name);
        }
    }
}
